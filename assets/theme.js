// Inserts a theme toggle (if missing) and handles desktop / iOS behavior.
(function () {
    // Inject toggle button if not present
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
  
    function onReady() {
      var btn = ensureToggleButton();
      if (!btn) return;
      setIcon(btn);
  
      btn.addEventListener("click", function () {
        var root = document.documentElement;
        var curr = root.dataset.theme === "light" ? "light" : "dark";
        var next = curr === "light" ? "dark" : "light";
  
        // iOS fallback: waifu over content + final disk expand
        if (isIOS()) {
          toggleIOS(next);
          setIcon(btn);
          return;
        }
  
        // Desktop / Chromium: View Transitions
        if (!document.startViewTransition) {
          applyTheme(next); setIcon(btn); return;
        }
        document.startViewTransition(function(){ applyTheme(next); setIcon(btn); });
      });
    }
  
    // Apply theme and store preference
    function applyTheme(next) {
      var root = document.documentElement;
      root.classList.add("theme-animating");
      root.dataset.theme = next;
      root.style.colorScheme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      setTimeout(function(){ root.classList.remove("theme-animating"); }, 350);
    }
  
    // iOS fallback: waifu as MASK (monochrome) over content → hold → final disk + switch
function toggleIOS(next) {
    var root = document.documentElement;
    var cs = getComputedStyle(root);
  
    var pos = (cs.getPropertyValue("--reveal-pos") || "50% 50%").trim().split(/\s+/);
    var left = pos[0] || "50%";
    var top  = pos[1] || "50%";
    var popDur    = ms(cs.getPropertyValue("--pop-dur")    || "160ms");
    var holdDur   = ms(cs.getPropertyValue("--hold-dur")   || "3000ms");
    var expandDur = ms(cs.getPropertyValue("--expand-dur") || "240ms");
    var ease      = (cs.getPropertyValue("--reveal-ease")  || "cubic-bezier(.2,.7,0,1)").trim();
    var popSize   = (cs.getPropertyValue("--pop-size")     || "28vmax").trim();
  
    // контейнер-оверлей без фона (ничего не закрывает)
    var overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483646";
    overlay.style.pointerEvents = "none";
    document.body.appendChild(overlay);
  
    // 1) ВАЙФУ-СИЛУЭТ: div с маской из GIF, закрашенный нужным цветом
    var waifu = document.createElement("div");
    waifu.style.position = "fixed";
    waifu.style.left = left;
    waifu.style.top  = top;
    waifu.style.transform = "translate(-50%,-50%) scale(.6)";
    // размер (квадрат). Если гифка не квадратная — см. примечание ниже.
    waifu.style.width  = "var(--ios-waifu-size)";
    waifu.style.height = "var(--ios-waifu-size)";
    waifu.style.zIndex = "2147483647";
    waifu.style.pointerEvents = "none";
  
    // Монохром: белая при переходе на LIGHT, чёрная при переходе на DARK
    waifu.style.background = (next === "light") ? "#fff" : "#000";
  
    // Гифка как маска (анимация кадров сохранится)
    var maskDecl = "url(/images/waifu-dance.gif) center / contain no-repeat";
    waifu.style.webkitMask = maskDecl;
    waifu.style.mask = maskDecl;
  
    overlay.appendChild(waifu);
  
    // быстрый POP
    waifu.style.animation = `ios-waifu-pop ${popDur} ${ease} both`;
  
    // 2) через HOLD — финальный диск нового фона + переключение темы
    setTimeout(function(){
      var disk = document.createElement("div");
      disk.style.position = "fixed";
      disk.style.left = left;
      disk.style.top  = top;
      disk.style.transform = "translate(-50%,-50%)";
      disk.style.width = popSize;
      disk.style.height = popSize;
      disk.style.borderRadius = "50%";
      disk.style.zIndex = "2147483646";
      disk.style.pointerEvents = "none";
  
      // переключаем тему прямо перед экспандом, чтобы var(--bg) стал новым цветом
      root.classList.add("theme-animating");
      root.dataset.theme = next;
      root.style.colorScheme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
  
      disk.style.background = "var(--bg)";
      overlay.appendChild(disk);
  
      // быстрый EXPAND
      disk.style.animation = `ios-disk-expand ${expandDur} ${ease} both`;
  
      setTimeout(function(){
        root.classList.remove("theme-animating");
        overlay.remove();
      }, expandDur + 80);
    }, popDur + holdDur);
  
    function ms(s){ return Number(String(s).replace(/[^0-9.]/g,"")) || 0; }
  }
  
  
    function ms(s){ return Number(String(s).replace(/[^0-9.]/g,"")) || 0; }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady);
    } else {
      onReady();
    }
  })();
  