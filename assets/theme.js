// /assets/theme.js
(function () {
    // авто-кнопка, если её нет
    function ensureToggleButton() {
      var btn = document.getElementById("themeToggle");
      if (btn) return btn;
      var nav = document.querySelector('nav[aria-label="Primary"]');
      if (!nav) return null;
      var sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = "·";
      btn = document.createElement("button");
      btn.id = "themeToggle";
      btn.className = "theme-btn";
      btn.type = "button";
      btn.title = "Toggle theme";
      btn.setAttribute("aria-label", "Toggle theme");
      nav.appendChild(sep);
      nav.appendChild(btn);
      return btn;
    }
  
    function isIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    }
  
    function setIcon(btn) {
      var isDark = document.documentElement.dataset.theme !== "light";
      btn.textContent = isDark ? "☾" : "☀";
    }
  
    // обычное переключение темы
    function applyTheme(next) {
      var root = document.documentElement;
      root.dataset.theme = next;
      root.style.colorScheme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    }
  
    // ---------- iOS fallback: overlay + clip-path (pop -> hold -> expand) ----------
    // ---------- iOS fallback: overlay WITH GIF MASK (pop -> hold -> expand) ----------
function switchThemeWithOverlay() {
    var root = document.documentElement;
    var next = root.dataset.theme === "light" ? "dark" : "light";
  
    // читаем токены из CSS
    var cs = getComputedStyle(root);
    var pos       = cs.getPropertyValue("--reveal-pos").trim()    || "50% 50%";
    var startSize = cs.getPropertyValue("--start-size").trim()    || "8vmax";
    var popSize   = cs.getPropertyValue("--pop-size").trim()      || "28vmax";
    var finalSize = cs.getPropertyValue("--final-size").trim()    || "150vmax";
    var popDur    = cs.getPropertyValue("--pop-dur").trim()       || "160ms";
    var holdDur   = cs.getPropertyValue("--hold-dur").trim()      || "3000ms";
    var expandDur = cs.getPropertyValue("--expand-dur").trim()    || "240ms";
    var ease      = cs.getPropertyValue("--reveal-ease").trim()   || "cubic-bezier(.2,.7,0,1)";
  
    // цвет НОВОЙ темы — оверлей закрасит экран новой палитрой,
    // а "дырку" в форме gif покажет через маску
    root.dataset.theme = next; // применим новый набор переменных, но спрячем его оверлеем
    root.style.colorScheme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  
    var newBg = getComputedStyle(root).getPropertyValue("--bg").trim() || "#fff";
  
    // overlay с gif-маской
    var overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483646";
    overlay.style.pointerEvents = "none";
    overlay.style.background = newBg;
  
    // маска — сама gif (анимированная)
    var maskDecl = `url(/images/waifu-dance.gif) ${pos} / ${startSize} no-repeat`;
    overlay.style.webkitMask = maskDecl;
    overlay.style.mask = maskDecl;
  
    // две анимации (используют те же @keyframes vt-pop/vt-expand из theme.css)
    overlay.style.animation =
      `vt-pop ${popDur} ${ease} both, vt-expand ${expandDur} ${ease} ${holdDur} both`;
  
    // подстрахуем локальные плавные перекраски
    root.classList.add("theme-animating");
    document.body.appendChild(overlay);
  
    // финальный cleanup
    var total = parseTime(popDur) + parseTime(holdDur) + parseTime(expandDur);
    setTimeout(function () {
      root.classList.remove("theme-animating");
      overlay.remove();
    }, total + 50);
  
    function parseTime(s){ return Number(String(s).replace(/[^0-9.]/g,"")) || 0; }
  }
  
  
    // утилита: "160ms" -> 160
    function parseTime(s){ return Number(String(s).replace(/[^0-9.]/g,"")) || 0; }
  
    function onReady() {
      var btn = ensureToggleButton();
      if (!btn) return;
      setIcon(btn);
  
      btn.addEventListener("click", function () {
        var next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  
        if (isIOS()) {
          // iOS fallback
          switchThemeWithOverlay();
          setIcon(btn);
          return;
        }
  
        // Нормальный путь с View Transitions
        if (!document.startViewTransition) {
          applyTheme(next);
          setIcon(btn);
          return;
        }
  
        document.startViewTransition(function () {
          applyTheme(next);
          setIcon(btn);
        });
      });
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady);
    } else {
      onReady();
    }
  })();
  