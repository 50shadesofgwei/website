(function () {
    // если кнопки нет в разметке — добавим автоматически в nav[aria-label="Primary"]
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
  
    function setIcon(btn) {
      var isDark = document.documentElement.dataset.theme !== "light";
      btn.textContent = isDark ? "☾" : "☀";
    }
  
    function switchTheme() {
      var root = document.documentElement;
      var next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      root.style.colorScheme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    }
  
    function onReady() {
      var btn = ensureToggleButton();
      if (!btn) return;
      setIcon(btn);
  
      btn.addEventListener("click", function () {
        if (!document.startViewTransition) {
          switchTheme(); setIcon(btn); return;
        }
        document.startViewTransition(function () { switchTheme(); setIcon(btn); });
      });
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady);
    } else {
      onReady();
    }
  })();