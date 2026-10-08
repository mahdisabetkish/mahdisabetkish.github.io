(function () {
  "use strict";

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var toggleBtn = document.getElementById("theme-toggle");

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
    if (toggleBtn) toggleBtn.textContent = theme === "dark" ? "☾" : "☀";
  }

  function getStored(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function setStored(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }

  var stored = getStored("theme");
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(stored || (prefersDark ? "dark" : "light"));

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      setStored("theme", next);
    });
  }

  /* ---------- Mobile menu ---------- */
  var menuToggle = document.getElementById("menu-toggle");
  var navLinks = document.getElementById("nav-links");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { navLinks.classList.remove("open"); });
    });
  }

  /* ---------- Active nav link on scroll ---------- */
  var sections = document.querySelectorAll("section[id]");
  var navAnchors = document.querySelectorAll("nav.nav-links a");

  function onScrollSpy() {
    var scrollPos = window.scrollY + 120;
    var current = null;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) current = sec.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScrollSpy, { passive: true });
  onScrollSpy();

  /* ---------- Rotating role text ---------- */
  var roleEl = document.getElementById("role-text");
  if (roleEl) {
    var roles = [
      "Self-Supervised Learning",
      "Bayesian Uncertainty Quantification",
      "ML for Genomics & Healthcare",
      "Computational Biology"
    ];
    var roleIdx = 0;
    var textSpan = roleEl.querySelector(".role-word");
    function cycleRole() {
      if (!textSpan) return;
      textSpan.style.opacity = 0;
      setTimeout(function () {
        roleIdx = (roleIdx + 1) % roles.length;
        textSpan.textContent = roles[roleIdx];
        textSpan.style.opacity = 1;
      }, 350);
    }
    if (textSpan) {
      textSpan.style.transition = "opacity 0.35s ease";
      textSpan.textContent = roles[0];
      setInterval(cycleRole, 2800);
    }
  }

  /* ---------- Count-up metrics ---------- */
  var metricEls = document.querySelectorAll(".metric .num[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var dur = 900;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && metricEls.length) {
    var metricIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          metricIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    metricEls.forEach(function (el) { metricIO.observe(el); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Back to top ---------- */
  var backBtn = document.getElementById("back-to-top");
  if (backBtn) {
    window.addEventListener("scroll", function () {
      backBtn.classList.toggle("show", window.scrollY > 500);
    }, { passive: true });
    backBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Project filter ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var projectCards = document.querySelectorAll(".project-card");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var filter = btn.getAttribute("data-filter");
      projectCards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(",");
        var show = filter === "all" || tags.indexOf(filter) !== -1;
        card.style.display = show ? "flex" : "none";
      });
    });
  });
})();
