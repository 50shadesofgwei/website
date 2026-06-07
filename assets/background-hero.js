(function () {
  var hero = document.getElementById("bgHero");
  if (!hero) return;

  var slideA = hero.querySelector(".bg-hero__slide--a");
  var slideB = hero.querySelector(".bg-hero__slide--b");
  var tint = hero.querySelector(".bg-hero__tint");
  if (!slideA || !slideB || !tint) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var crossfadeMs = reduceMotion ? 500 : 2200;
  var holdMs = reduceMotion ? 2200 : 9000;
  var tintOpacity = 0.2;

  var slides = [];
  var order = [];
  var index = 0;
  var activeLayer = "a";
  var currentTint = "#141210";
  var phaseTimer = null;
  var tintFrame = null;
  var running = false;
  var firstBeat = true;

  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function reshuffleOrder(lastId) {
    var next = shuffle(slides);
    if (slides.length > 1 && lastId) {
      var attempts = 0;
      while (next[0].id === lastId && attempts < 12) {
        next = shuffle(slides);
        attempts++;
      }
    }
    return next;
  }

  function currentSlide() {
    return order[index];
  }

  function layerEls() {
    return activeLayer === "a"
      ? { visible: slideA, hidden: slideB }
      : { visible: slideB, hidden: slideA };
  }

  function hexToRgb(hex) {
    var value = hex.replace("#", "");
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    function part(n) {
      var s = Math.round(n).toString(16);
      return s.length === 1 ? "0" + s : s;
    }
    return "#" + part(r) + part(g) + part(b);
  }

  function lerpColor(fromHex, toHex, t) {
    var a = hexToRgb(fromHex);
    var b = hexToRgb(toHex);
    return rgbToHex(
      a.r + (b.r - a.r) * t,
      a.g + (b.g - a.g) * t,
      a.b + (b.b - a.b) * t
    );
  }

  function setTint(color, opacity) {
    currentTint = color;
    tint.style.backgroundColor = color;
    tint.style.setProperty("--bg-tint", color);
    tint.style.setProperty("--bg-tint-opacity", String(opacity));
  }

  function animateTint(fromColor, toColor, duration) {
    if (tintFrame) {
      cancelAnimationFrame(tintFrame);
      tintFrame = null;
    }

    var start = performance.now();

    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setTint(lerpColor(fromColor, toColor, eased), tintOpacity);
      if (t < 1) {
        tintFrame = requestAnimationFrame(frame);
      } else {
        tintFrame = null;
      }
    }

    tintFrame = requestAnimationFrame(frame);
  }

  function preload(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(url); };
      img.onerror = function () { resolve(url); };
      img.src = url;
    });
  }

  function clearTimers() {
    if (phaseTimer) {
      clearTimeout(phaseTimer);
      phaseTimer = null;
    }
  }

  function crossfadeTo(slide) {
    return new Promise(function (resolve) {
      var layers = layerEls();
      var fromTint = currentTint;
      layers.hidden.style.backgroundImage = "url(" + slide.image + ")";
      void layers.hidden.offsetWidth;
      layers.visible.classList.remove("is-visible");
      layers.hidden.classList.add("is-visible");
      activeLayer = activeLayer === "a" ? "b" : "a";
      animateTint(fromTint, slide.color, crossfadeMs);
      phaseTimer = setTimeout(resolve, crossfadeMs);
    });
  }

  function advance() {
    index += 1;
    if (index >= order.length) {
      var lastId = order[order.length - 1] ? order[order.length - 1].id : null;
      order = reshuffleOrder(lastId);
      index = 0;
    }
    runBeat();
  }

  function runBeat() {
    clearTimers();
    var slide = currentSlide();
    if (!slide) return;

    if (!firstBeat) {
      crossfadeTo(slide).then(function () {
        phaseTimer = setTimeout(advance, holdMs);
      });
      return;
    }

    firstBeat = false;
    phaseTimer = setTimeout(advance, holdMs);
  }

  function start() {
    if (running || !slides.length) return;
    running = true;
    order = shuffle(slides);
    index = 0;
    var first = order[0];
    slideA.style.backgroundImage = "url(" + first.image + ")";
    slideA.classList.add("is-visible");
    setTint(first.color, tintOpacity);
    runBeat();
  }

  fetch("/assets/backgrounds.json")
    .then(function (res) {
      if (!res.ok) throw new Error("manifest");
      return res.json();
    })
    .then(function (data) {
      slides = data.slides || [];
      if (!slides.length) return;
      return Promise.all(slides.map(function (s) { return preload(s.image); }));
    })
    .then(function () {
      if (slides.length) start();
    })
    .catch(function () {
      hero.classList.add("bg-hero--failed");
    });
})();
