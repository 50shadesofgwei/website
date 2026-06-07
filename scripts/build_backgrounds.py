#!/usr/bin/env python3
"""Process background images: upgrade low-res sources, optimize for web."""

from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path("/Users/zk50/Downloads/New Folder With Items")
OUT = ROOT / "images" / "backgrounds"
MANIFEST = ROOT / "assets" / "backgrounds.json"

MIN_LONG_EDGE = 1920
MAX_LONG_EDGE = 1920
JPEG_QUALITY = 82

# Identified via reverse image search / visual matching.
# Public-domain or CC sources only; otherwise keep the local screenshot.
HD_SOURCES: dict[str, str] = {
    "IMG_8267.jpg": "https://upload.wikimedia.org/wikipedia/commons/d/dd/Gustave_Dore_Inferno1.jpg",
    "IMG_8272.jpg": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Witches_going_to_their_Sabbath_by_Luis_Ricardo_Falero.jpg",
    "IMG_8260.jpg": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Moonlit_Night_%28Aivazovsky%29.jpg",
    "IMG_8261.jpg": "https://lakeimagesweb.artic.edu/iiif/2/273331/full/2000,/0/default.jpg",
}

SLUGS = {
    "IMG_8251.jpg": "blue-cigarette",
    "IMG_8252.jpg": "sparkling-water",
    "IMG_8253.jpg": "garden-fountain",
    "IMG_8254.jpg": "green-light-couple",
    "IMG_8255.jpg": "robert-plant",
    "IMG_8256.jpg": "angels-harp",
    "IMG_8257.jpg": "shadow-flowers",
    "IMG_8258.jpg": "want-to-be",
    "IMG_8259.jpg": "forest-girl",
    "IMG_8260.jpg": "moonlit-cliff",
    "IMG_8261.jpg": "green-moon-lane",
    "IMG_8262.jpg": "clock-face",
    "IMG_8263.jpg": "profile-portrait",
    "IMG_8264.jpg": "white-robes-lake",
    "IMG_8265.jpg": "dylan-chess",
    "IMG_8266.jpg": "helicopter-fall",
    "IMG_8267.jpg": "dante-forest",
    "IMG_8268.jpg": "collage-grid",
    "IMG_8269.jpg": "eye-grid",
    "IMG_8270.jpg": "big-jay-mcneely",
    "IMG_8271.jpg": "ship-sunset",
    "IMG_8272.jpg": "witches-sabbath",
}


def dominant_color(im: Image.Image) -> str:
    small = im.convert("RGB").resize((48, 48), Image.Resampling.LANCZOS)
    px = list(small.getdata())
    r = sum(p[0] for p in px) // len(px)
    g = sum(p[1] for p in px) // len(px)
    b = sum(p[2] for p in px) // len(px)
    return f"#{r:02x}{g:02x}{b:02x}"


def download(url: str, dest: Path) -> bool:
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=90) as resp:
                dest.write_bytes(resp.read())
            return True
        except Exception as exc:
            print(f"  download attempt {attempt + 1} failed: {exc}")
            time.sleep(8 * (attempt + 1))
    return False


def optimize(src: Path, dst: Path) -> tuple[str, int, int, int]:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    long_edge = max(w, h)
    source_long = long_edge

    if long_edge > MAX_LONG_EDGE:
        ratio = MAX_LONG_EDGE / long_edge
        im = im.resize((int(w * ratio), int(h * ratio)), Image.Resampling.LANCZOS)
        w, h = im.size
        long_edge = max(w, h)

    color = dominant_color(im)
    im.save(dst, "JPEG", quality=JPEG_QUALITY, optimize=True)
    upgraded = source_long >= MIN_LONG_EDGE or src.name in HD_SOURCES
    return color, w, h, source_long if upgraded else source_long


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    slides = []
    report = []

    for src_name in sorted(SLUGS):
        slug = SLUGS[src_name]
        src_path = SRC / src_name
        out_name = f"{slug}.jpg"
        out_path = OUT / out_name
        work_path = OUT / f".work_{slug}.jpg"

        used_hd = False
        if src_name in HD_SOURCES:
            print(f"upgrading {src_name} -> {HD_SOURCES[src_name]}")
            time.sleep(6)
            if download(HD_SOURCES[src_name], work_path):
                used_hd = True
            else:
                print(f"  falling back to local {src_name}")

        if not used_hd:
            if not src_path.exists():
                print(f"missing {src_path}")
                continue
            work_path.write_bytes(src_path.read_bytes())

        color, w, h, source_long = optimize(work_path, out_path)
        work_path.unlink(missing_ok=True)

        status = "hd" if source_long >= MIN_LONG_EDGE or used_hd else "source"
        report.append(
            {
                "id": slug,
                "source": src_name,
                "output": out_name,
                "source_long_edge": source_long,
                "output_size": [w, h],
                "upgraded": used_hd,
                "status": status,
            }
        )
        slides.append(
            {
                "id": slug,
                "image": f"/images/backgrounds/{out_name}",
                "color": color,
            }
        )
        print(f"{slug}: {w}x{h} ({status})")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps({"slides": slides}, indent=2) + "\n")
    (ROOT / "scripts" / "background_report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"\nWrote {len(slides)} slides to {MANIFEST}")


if __name__ == "__main__":
    main()
