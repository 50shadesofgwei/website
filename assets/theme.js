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
 // iOS fallback: поверх страницы только гифка → поп → 3s → быстрый диск + смена темы
function switchThemeWithOverlay() {
    var root = document.documentElement;
    var curr = root.dataset.theme === "light" ? "light" : "dark";
    var next = curr === "light" ? "dark" : "light";
  
    // читаем токены
    var cs = getComputedStyle(root);
    var pos       = (cs.getPropertyValue("--reveal-pos") || "50% 50%").trim();
    var popDur    = (cs.getPropertyValue("--pop-dur") || "160ms").trim();
    var holdDur   = (cs.getPropertyValue("--hold-dur") || "3000ms").trim();
    var expandDur = (cs.getPropertyValue("--expand-dur") || "240ms").trim();
    var ease      = (cs.getPropertyValue("--reveal-ease") || "cubic-bezier(.2,.7,0,1)").trim();
    var popSize   = (cs.getPropertyValue("--pop-size") || "28vmax").trim();
  
    // контейнер-оверлей без фона (ничего не закрывает)
    var overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483646";
    overlay.style.pointerEvents = "none";
    document.body.appendChild(overlay);
  
    // 1) ВАЙФУ поверх страницы, танцует 3s. Цвет зависит от направления.
    var img = new Image();
    img.src = "/images/waifu-dance.gif";
    img.alt = "";
    img.decoding = "async";
    img.style.position = "fixed";
    img.style.left = pos.split(" ")[0] || "50%";
    img.style.top  = pos.split(" ")[1] || "50%";
    img.style.transform = "translate(-50%,-50%) scale(.6)";
    img.style.width = "var(--ios-waifu-size)";
    img.style.height = "auto";
    img.style.zIndex = "2147483647";
    img.style.pointerEvents = "none";
    // белая на тёмный → оставляем; чёрная на светлый → invert
    img.style.filter = next === "dark" ? "invert(1)" : "none";
    overlay.appendChild(img);
  
    // быстрый POP до среднего размера
    img.style.animation = `ios-waifu-pop ${popDur} ${ease} both`;
  
    // 2) через hold запускаем быстрый EXPAND диском нового фона и переключаем тему
    setTimeout(function () {
      var disk = document.createElement("div");
      disk.style.position = "fixed";
      disk.style.left = img.style.left;
      disk.style.top  = img.style.top;
      disk.style.transform = "translate(-50%,-50%)";
      disk.style.width = popSize;
      disk.style.height = popSize;
      disk.style.borderRadius = "50%";
      disk.style.background = "var(--bg)"; // всегда берём из активной темы
      disk.style.zIndex = "2147483646";    // под гифкой, но над контентом
      overlay.appendChild(disk);
  
      // переключаем тему ровно с началом экспанда — цвет диска автоматически станет новым
      root.dataset.theme = next;
      root.style.colorScheme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
  
      // быстрый рывок до финала
      disk.style.animation = `ios-disk-expand ${expandDur} ${ease} both`;
  
      // убираем всё чуть позже
      setTimeout(function () {
        overlay.remove();
      }, parseMs(expandDur) + 60);
    }, parseMs(popDur) + parseMs(holdDur));
  
    function parseMs(s){ return Number(String(s).replace(/[^0-9.]/g,"")) || 0; }
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
  