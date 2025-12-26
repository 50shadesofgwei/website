// Language switcher functionality
(function() {
  var currentLang = localStorage.getItem('language') || 'en';
  var languages = ['en', 'es', 'ru'];
  var langNames = { en: 'EN', es: 'ES', ru: 'RU' };
  
  function initLanguage() {
    // Create language button
    var langBtn = document.createElement('button');
    langBtn.id = 'langToggle';
    langBtn.className = 'lang-btn';
    langBtn.textContent = langNames[currentLang];
    langBtn.setAttribute('aria-label', 'Toggle language');
    langBtn.setAttribute('title', 'Toggle language');
    
    // Insert before theme toggle
    var themeBtn = document.getElementById('themeToggle');
    var nav = document.querySelector('nav[aria-label="Primary"]');
    if (nav && themeBtn) {
      var sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '\u00B7';
      nav.insertBefore(sep, themeBtn);
      nav.insertBefore(langBtn, sep);
    } else if (nav) {
      var sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '\u00B7';
      nav.appendChild(sep);
      nav.appendChild(langBtn);
    }
    
    // Add click handler
    langBtn.addEventListener('click', function() {
      var currentIndex = languages.indexOf(currentLang);
      var nextIndex = (currentIndex + 1) % languages.length;
      currentLang = languages[nextIndex];
      localStorage.setItem('language', currentLang);
      langBtn.textContent = langNames[currentLang];
      applyLanguage(currentLang);
    });
    
    // Apply initial language
    applyLanguage(currentLang);
  }
  
  function applyLanguage(lang) {
    if (typeof translations === 'undefined' || !translations[lang]) {
      // Translations not loaded yet, try again after a short delay
      setTimeout(function() {
        if (typeof translations !== 'undefined' && translations[lang]) {
          applyLanguage(lang);
        }
      }, 50);
      return;
    }
    
    var t = translations[lang];
    var page = getCurrentPage();
    
    // Update name
    var nameElem = document.querySelector('h1[data-translate="name"]');
    if (nameElem && t.name) {
      nameElem.textContent = t.name;
    }
    
    // Update navigation
    var navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(function(link) {
      var href = link.getAttribute('href') || '';
      var isCurrent = link.hasAttribute('aria-current');
      if (href.includes('index.html') || href === '/' || href === '') {
        link.innerHTML = isCurrent ? '<b>' + t.nav.home + '</b>' : t.nav.home;
      } else if (href.includes('stuff.html')) {
        link.innerHTML = isCurrent ? '<b>' + t.nav.stuff + '</b>' : t.nav.stuff;
      } else if (href.includes('contact.html')) {
        link.innerHTML = isCurrent ? '<b>' + t.nav.contact + '</b>' : t.nav.contact;
      }
    });
    
    // Update page content
    if (page === 'index' && t.index) {
      var elems = document.querySelectorAll('[data-translate]');
      elems.forEach(function(elem) {
        var key = elem.getAttribute('data-translate');
        if (t.index[key]) {
          if (key === 'highlight') {
            elem.innerHTML = '<b>' + t.index.highlight + '</b>';
          } else if (key === 'tolerance') {
            elem.innerHTML = '<span style="color: red;">' + t.index.tolerance + '</span>';
          } else if (key === 'understood') {
            elem.textContent = t.index.understood;
          } else if (key === 'mission-section') {
            elem.innerHTML = t.index['mission-section'];
          } else {
            elem.textContent = t.index[key];
          }
        }
      });
    } else if (page === 'stuff' && t.stuff) {
      var elems = document.querySelectorAll('[data-translate]');
      elems.forEach(function(elem) {
        var key = elem.getAttribute('data-translate');
        if (t.stuff[key]) {
          elem.innerHTML = t.stuff[key];
        }
      });
    } else if (page === 'contact' && t.contact) {
      var labels = document.querySelectorAll('[data-translate]');
      labels.forEach(function(label) {
        var key = label.getAttribute('data-translate');
        if (t.contact[key]) {
          label.innerHTML = '<b>' + t.contact[key] + '</b>';
        }
      });
    }
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  }
  
  function getCurrentPage() {
    var path = window.location.pathname;
    var href = window.location.href;
    if (path.includes('index.html') || path === '/' || path.endsWith('/') || href.includes('index.html')) return 'index';
    if (path.includes('stuff.html') || href.includes('stuff.html')) return 'stuff';
    if (path.includes('contact.html') || href.includes('contact.html')) return 'contact';
    return 'index';
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
  } else {
    initLanguage();
  }
})();

