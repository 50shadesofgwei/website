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
  
// iOS fallback: GIF hole (xor) -> pop (fast) -> hold -> expand (fast)
function switchThemeWithOverlay() {
    var root = document.documentElement;
    var curr = root.dataset.theme === "light" ? "light" : "dark";
    var next = curr === "light" ? "dark" : "light";
  
    // читаем токены
    var cs = getComputedStyle(root);
    var pos       = (cs.getPropertyValue("--reveal-pos")   || "50% 50%").trim();
    var startSize = (cs.getPropertyValue("--start-size")   || "8vmax").trim();
    var popSize   = (cs.getPropertyValue("--pop-size")     || "28vmax").trim();
    var finalSize = (cs.getPropertyValue("--final-size")   || "150vmax").trim();
    var popDur    = (cs.getPropertyValue("--pop-dur")      || "160ms").trim();
    var holdDur   = (cs.getPropertyValue("--hold-dur")     || "3000ms").trim();
    var expandDur = (cs.getPropertyValue("--expand-dur")   || "240ms").trim();
    var ease      = (cs.getPropertyValue("--reveal-ease")  || "cubic-bezier(.2,.7,0,1)").trim();
  
    // текущий фон старой темы — закрасим им внешнюю область
    var currBg = cs.getPropertyValue("--bg").trim() || (curr === "dark" ? "#000" : "#fff");
  
    // overlay: старый фон + маска-дырка по форме GIF
    var overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483646";
    overlay.style.pointerEvents = "none";
    overlay.style.background = currBg;
  
    // две маски: [полный прямоугольник] XOR [GIF] = "дырка"
    var full = "linear-gradient(#fff,#fff)";
    var gif  = "url(/images/waifu-dance.gif)";
    overlay.style.webkitMaskImage    = `${full}, ${gif}`;
    overlay.style.webkitMaskComposite= "xor";
    overlay.style.webkitMaskRepeat   = "no-repeat, no-repeat";
    overlay.style.webkitMaskPosition = `0 0, ${pos}`;
    overlay.style.webkitMaskSize     = `auto, ${startSize}`;
    // стандартные свойства на будущее
    overlay.style.maskImage    = `${full}, ${gif}`;
    overlay.style.maskComposite= "exclude";
    overlay.style.maskRepeat   = "no-repeat, no-repeat";
    overlay.style.maskPosition = `0 0, ${pos}`;
    overlay.style.maskSize     = `auto, ${startSize}`;
  
    document.body.appendChild(overlay);
  
    // Включаем НОВУЮ тему под оверлеем сразу — через «дырку» видно текст/фон новой темы
    root.dataset.theme = next;
    root.style.colorScheme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  
    // локальные плавные перекраски (таблицы и т.п.)
    root.classList.add("theme-animating");
  
    // АНИМАЦИИ ЧЕРЕЗ CSS KEYFRAMES (см. ios-pop / ios-expand в theme.css)
    overlay.style.animation =
      `ios-pop ${popDur} ${ease} both, ios-expand ${expandDur} ${ease} ${holdDur} both`;
  
    // уборка
    var total =
      parseTime(popDur) + parseTime(holdDur) + parseTime(expandDur) + 80;
    setTimeout(function(){
      root.classList.remove("theme-animating");
      overlay.remove();
    }, total);
  
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
  