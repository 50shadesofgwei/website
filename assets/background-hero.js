(function () {
  var hero = document.getElementById("bgHero");
  if (!hero) return;

  var slideA = hero.querySelector(".bg-hero__slide--a");
  var slideB = hero.querySelector(".bg-hero__slide--b");
  if (!slideA || !slideB) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileQuery = window.matchMedia("(max-width: 768px)");
  var crossfadeMs = reduceMotion ? 500 : 2200;
  var holdMs = reduceMotion ? 2200 : 9000;
  var tintOpacity = 0.2;

  var slides = [];
  var order = [];
  var index = 0;
  var activeLayer = "a";
  var phaseTimer = null;
  var running = false;
  var firstBeat = true;
  var beat = 0;
  var loadedUrls = Object.create(null);
  var started = false;

  function isMobile() {
    return mobileQuery.matches;
  }

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

  function upcomingSlide() {
    if (!order.length) return null;
    var nextIndex = index + 1;
    if (nextIndex >= order.length) return order[0];
    return order[nextIndex];
  }

  function layerEls() {
    return activeLayer === "a"
      ? { visible: slideA, hidden: slideB }
      : { visible: slideB, hidden: slideA };
  }

  // Baking the tint into each slide keeps the crossfade a pure opacity change:
  // a separate tint layer would repaint the whole viewport on every frame.
  function layerBackground(slide) {
    var value = slide.color.replace("#", "");
    var wash =
      "rgba(" +
      parseInt(value.slice(0, 2), 16) + "," +
      parseInt(value.slice(2, 4), 16) + "," +
      parseInt(value.slice(4, 6), 16) + "," +
      tintOpacity + ")";
    return "linear-gradient(" + wash + "," + wash + "), url(" + slide.image + ")";
  }

  function preload(url) {
    if (loadedUrls[url]) return loadedUrls[url];
    loadedUrls[url] = new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        function done() { resolve(url); }
        if (img.decode) img.decode().then(done).catch(done);
        else done();
      };
      img.onerror = function () { resolve(url); };
      img.src = url;
    });
    return loadedUrls[url];
  }

  function prefetchUpcoming() {
    var upcoming = upcomingSlide();
    if (upcoming) preload(upcoming.image);
  }

  function clearTimers() {
    if (phaseTimer) {
      clearTimeout(phaseTimer);
      phaseTimer = null;
    }
  }

  function crossfadeTo(slide, token) {
    return preload(slide.image).then(function () {
      if (token !== beat || document.hidden) return;
      return new Promise(function (resolve) {
        hero.classList.add("is-crossfading");
        var layers = layerEls();
        layers.hidden.style.backgroundImage = layerBackground(slide);
        void layers.hidden.offsetWidth;
        layers.visible.classList.remove("is-visible");
        layers.hidden.classList.add("is-visible");
        activeLayer = activeLayer === "a" ? "b" : "a";
        phaseTimer = setTimeout(function () {
          hero.classList.remove("is-crossfading");
          prefetchUpcoming();
          resolve();
        }, crossfadeMs);
      });
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
    if (document.hidden) return;
    clearTimers();
    var slide = currentSlide();
    if (!slide) return;

    // Anything still in flight from an earlier beat is stale and must not schedule again
    var token = ++beat;

    if (!firstBeat) {
      crossfadeTo(slide, token).then(function () {
        if (token !== beat || document.hidden) return;
        phaseTimer = setTimeout(advance, holdMs);
      });
      return;
    }

    firstBeat = false;
    prefetchUpcoming();
    phaseTimer = setTimeout(advance, holdMs);
  }

  function stopCarousel() {
    clearTimers();
    beat++;
    running = false;
    firstBeat = true;
    hero.classList.remove("is-crossfading");
    hero.classList.add("bg-hero--static");
  }

  function startCarousel() {
    if (running || !slides.length) return;
    hero.classList.remove("bg-hero--static");
    running = true;
    runBeat();
  }

  function start() {
    if (started || !slides.length) return;
    started = true;
    order = shuffle(slides);
    index = 0;
    var first = order[0];

    preload(first.image).then(function () {
      slideA.style.backgroundImage = layerBackground(first);
      slideA.classList.add("is-visible");
      if (isMobile()) startCarousel();
      else {
        hero.classList.add("bg-hero--static");
        prefetchUpcoming();
      }
    });
  }

  function onViewportChange() {
    if (!started || !slides.length) return;
    if (isMobile()) startCarousel();
    else stopCarousel();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      clearTimers();
      beat++;
      hero.classList.remove("is-crossfading");
      return;
    }
    if (!running) return;
    clearTimers();
    // The current slide is already on screen, so wait out the hold rather than
    // repeating its crossfade every time the tab regains focus
    if (firstBeat) runBeat();
    else phaseTimer = setTimeout(advance, holdMs);
  });

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", onViewportChange);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(onViewportChange);
  }

  fetch("/assets/backgrounds.json")
    .then(function (res) {
      if (!res.ok) throw new Error("manifest");
      return res.json();
    })
    .then(function (data) {
      slides = data.slides || [];
      if (slides.length) start();
    })
    .catch(function () {
      hero.classList.add("bg-hero--failed");
    });
})();
