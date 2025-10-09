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
  
    // ---------- iOS fallback: overlay WITH GIF MASK (pop -> hold -> expand) ----------
// ---------- iOS fallback: GIF mask with correct colors (pop → hold → expand) ----------
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
  
    // текущий фон (на всякий случай, чтобы перекрыть возможный мигание)
    var currBg = cs.getPropertyValue("--bg").trim() || (curr === "dark" ? "#000" : "#fff");
  
    // 1) Ставим ОВЕРЛЕЙ (пока с фоном текущей темы, чтобы ничего не мигнуло)
    var overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483646";
    overlay.style.pointerEvents = "none";
    overlay.style.background = currBg;
    // маска-графика (вайфу)
    var maskDecl = `url(/images/waifu-dance.gif) ${pos} / ${startSize} no-repeat`;
    overlay.style.webkitMask = maskDecl;
    overlay.style.mask = maskDecl;
    document.body.appendChild(overlay);
  
    // 2) Под оверлеем вычисляем ЦВЕТ БУДУЩЕЙ темы и красим им overlay
    // (делаем незаметно, т.к. экран закрыт overlay)
    root.dataset.theme = next;
    root.style.colorScheme = next;
    var nextBg = getComputedStyle(root).getPropertyValue("--bg").trim() || (next === "dark" ? "#000" : "#fff");
    // откатываем назад: пока пользователь должен видеть старую тему
    root.dataset.theme = curr;
    root.style.colorScheme = curr;
  
    overlay.style.background = nextBg;
  
    // 3) Анимация маски: pop → hold → expand
    //    (используем те же keyframes vt-pop/vt-expand, что и в theme.css)
    var popMs    = parseTime(popDur);
    var holdMs   = parseTime(holdDur);
    var expandMs = parseTime(expandDur);
  
    // стартовое состояние
    overlay.style.webkitMaskSize = startSize;
    overlay.style.maskSize       = startSize;
  
    // быстрый POP
    overlay.animate(
      [{webkitMaskSize: startSize, maskSize: startSize}, {webkitMaskSize: popSize, maskSize: popSize}],
      {duration: popMs, easing: ease, fill: "forwards"}
    );
  
    // через hold — EXPAND
    setTimeout(function(){
      overlay.animate(
        [{webkitMaskSize: popSize, maskSize: popSize}, {webkitMaskSize: finalSize, maskSize: finalSize}],
        {duration: expandMs, easing: ease, fill: "forwards"}
      );
      // прямо перед EXPAND переключаем тему по-настоящему
      root.dataset.theme = next;
      root.style.colorScheme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    }, popMs + holdMs);
  
    // плавные локальные перекраски (таблицы и т.п.)
    root.classList.add("theme-animating");
    setTimeout(function(){
      root.classList.remove("theme-animating");
      overlay.remove();
    }, popMs + holdMs + expandMs + 60);
  
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
  