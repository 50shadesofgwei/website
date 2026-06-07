#!/usr/bin/env python3
"""Add rotating backdrop markup to all site HTML pages."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

CSS_LINK = '    <link rel="stylesheet" href="/assets/background-hero.css" />\n'
BACKDROP_BLOCK = """    <div id="bgHero" class="bg-hero bg-hero--backdrop" aria-hidden="true">
      <div class="bg-hero__visual">
        <div class="bg-hero__slide bg-hero__slide--a"></div>
        <div class="bg-hero__slide bg-hero__slide--b"></div>
        <div class="bg-hero__tint"></div>
        <div class="bg-hero__scrim"></div>
      </div>
    </div>
"""
BACKDROP_BLOCK_MESSY = """        <div id="bgHero" class="bg-hero bg-hero--backdrop" aria-hidden="true">
      <div class="bg-hero__visual">
        <div class="bg-hero__slide bg-hero__slide--a"></div>
        <div class="bg-hero__slide bg-hero__slide--b"></div>
        <div class="bg-hero__tint"></div>
        <div class="bg-hero__scrim"></div>
      </div>
    </div>
"""
SCRIPT_TAG = '    <script src="/assets/background-hero.js"></script>\n'


def patch_file(path: Path) -> bool:
    text = path.read_text()
    if "background-hero.css" in text:
        return False

    if '<link rel="stylesheet" href="/assets/theme.css" />' in text:
        text = text.replace(
            '<link rel="stylesheet" href="/assets/theme.css" />',
            '<link rel="stylesheet" href="/assets/theme.css" />\n' + CSS_LINK.rstrip("\n"),
            1,
        )
    elif '<link rel="stylesheet" href="../assets/theme.css" />' in text:
        text = text.replace(
            '<link rel="stylesheet" href="../assets/theme.css" />',
            '<link rel="stylesheet" href="../assets/theme.css" />\n    <link rel="stylesheet" href="/assets/background-hero.css" />',
            1,
        )
    elif '<link rel="stylesheet" href="../../assets/theme.css" />' in text:
        text = text.replace(
            '<link rel="stylesheet" href="../../assets/theme.css" />',
            '<link rel="stylesheet" href="../../assets/theme.css" />\n    <link rel="stylesheet" href="/assets/background-hero.css" />',
            1,
        )
    else:
        return False

    text = text.replace("<body>", '<body class="page-with-backdrop">', 1)
    text = text.replace("<body>\n", '<body class="page-with-backdrop">\n', 1)

    if "<body>" in text and 'class="page-with-backdrop"' not in text:
        text = text.replace("<body>", '<body class="page-with-backdrop">', 1)

    if "<div class=\"wrap\">" in text:
        text = text.replace("<div class=\"wrap\">", BACKDROP_BLOCK + "    <div class=\"wrap\">", 1)
    elif '<div class="wrap">' in text:
        text = text.replace('<div class="wrap">', BACKDROP_BLOCK + '    <div class="wrap">', 1)
    else:
        return False

    if "</body>" in text:
        text = text.replace("</body>", SCRIPT_TAG + "  </body>", 1)

    path.write_text(text)
    return True


def main() -> None:
    changed = 0
    for path in sorted(ROOT.rglob("*.html")):
        if patch_file(path):
            changed += 1
            print(path.relative_to(ROOT))
    print(f"Patched {changed} files")


if __name__ == "__main__":
    main()
