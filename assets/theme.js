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
      sep.innerHTML = "&middot;";
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
      btn.textContent = isDark ? "\u263E" : "\u2600";
    }
  
    function onReady() {
      var btn = ensureToggleButton();
      if (!btn) return;
      setIcon(btn);
  
      btn.addEventListener("click", function () {
        var root = document.documentElement;
        var curr = root.dataset.theme === "light" ? "light" : "dark";
        var next = curr === "light" ? "dark" : "light";
  
        // iOS fallback: circular reveal animation
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
  
    // iOS fallback: simple circular reveal animation
function toggleIOS(next) {
    var root = document.documentElement;
    var cs = getComputedStyle(root);
  
    var pos = (cs.getPropertyValue("--reveal-pos") || "50% 50%").trim().split(/\s+/);
    var left = pos[0] || "50%";
    var top  = pos[1] || "50%";
    var popDur    = ms(cs.getPropertyValue("--pop-dur")    || "160ms");
    var expandDur = ms(cs.getPropertyValue("--expand-dur") || "240ms");
    var ease      = (cs.getPropertyValue("--reveal-ease")  || "cubic-bezier(.2,.7,0,1)").trim();
    var popSize   = (cs.getPropertyValue("--pop-size")     || "28vmax").trim();
  
    var overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483646";
    overlay.style.pointerEvents = "none";
    document.body.appendChild(overlay);
  
    // Create initial small disk
    var disk = document.createElement("div");
    disk.style.position = "fixed";
    disk.style.left = left;
    disk.style.top  = top;
    disk.style.transform = "translate(-50%,-50%)";
    disk.style.width = "var(--start-size)";
    disk.style.height = "var(--start-size)";
    disk.style.borderRadius = "50%";
    disk.style.zIndex = "2147483647";
    disk.style.pointerEvents = "none";
  
    // Switch theme before animation
    root.classList.add("theme-animating");
    root.dataset.theme = next;
    root.style.colorScheme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  
    disk.style.background = "var(--bg)";
    overlay.appendChild(disk);
  
    // Pop animation
    disk.style.animation = `ios-disk-pop ${popDur} ${ease} both`;
  
    // Expand to full screen
    setTimeout(function(){
      disk.style.animation = `ios-disk-expand ${expandDur} ${ease} both`;
      setTimeout(function(){
        root.classList.remove("theme-animating");
        overlay.remove();
      }, expandDur + 80);
    }, popDur);
  
    function ms(s){ return Number(String(s).replace(/[^0-9.]/g,"")) || 0; }
  }
  
  
    function ms(s){ return Number(String(s).replace(/[^0-9.]/g,"")) || 0; }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady);
    } else {
      onReady();
    }
  })();
  