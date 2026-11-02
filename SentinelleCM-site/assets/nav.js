(function(){
  // ---- Page fade-in on load ----
  document.addEventListener('DOMContentLoaded', function(){
    requestAnimationFrame(function(){ document.body.classList.add('loaded'); });
  });

  // ---- Scroll progress bar ----
  var progressBar = document.getElementById('progress-bar');
  function updateProgress(){
    if(!progressBar) return;
    var h = document.documentElement;
    var scrolled = h.scrollTop || document.body.scrollTop;
    var height = (h.scrollHeight - h.clientHeight) || 1;
    progressBar.style.width = Math.min(100, (scrolled / height) * 100) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive:true });
  updateProgress();

  // ---- Back to top ----
  var backToTop = document.getElementById('back-to-top');
  function updateBackToTop(){
    if(!backToTop) return;
    if(window.scrollY > 480) backToTop.classList.add('show');
    else backToTop.classList.remove('show');
  }
  window.addEventListener('scroll', updateBackToTop, { passive:true });
  updateBackToTop();
  if(backToTop){
    backToTop.addEventListener('click', function(){
      window.scrollTo({ top:0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }

  // ---- Page nav scrollspy (mini sommaire) ----
  var pageNavLinks = document.querySelectorAll('.page-nav a[href^="#"]');
  if(pageNavLinks.length){
    var spySections = [];
    pageNavLinks.forEach(function(a){
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if(el) spySections.push({ link:a, el:el });
    });
    function updateSpy(){
      var pos = window.scrollY + 140;
      var current = spySections[0];
      spySections.forEach(function(s){ if(s.el.offsetTop <= pos) current = s; });
      spySections.forEach(function(s){ s.link.classList.toggle('active', s === current); });
    }
    window.addEventListener('scroll', updateSpy, { passive:true });
    updateSpy();
  }

  // ---- Mobile menu toggle ----
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobile-menu');
  if(burger && mobileMenu){
    burger.addEventListener('click', function(){
      mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', mobileMenu.classList.contains('open'));
    });
    mobileMenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ mobileMenu.classList.remove('open'); });
    });
  }

  // ---- Duplicate marquee content for seamless infinite loop ----
  document.querySelectorAll('.marquee-track').forEach(function(track){
    track.innerHTML = track.innerHTML + track.innerHTML;
  });

  // ---- Scroll reveal ----
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal, .reveal-scale');
  if(reduceMotion){
    revealEls.forEach(function(el){ el.classList.add('in-view'); });
  } else if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.15, rootMargin:'0px 0px -40px 0px' });
    revealEls.forEach(function(el, i){
      el.style.transitionDelay = (i % 6) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in-view'); });
  }

  // ---- Animated counters ----
  var counters = document.querySelectorAll('[data-counter]');
  function animateCounter(el){
    var target = parseInt(el.getAttribute('data-counter'), 10) || 0;
    var suffix = el.getAttribute('data-counter-suffix') || '';
    if(reduceMotion){ el.textContent = target + suffix; return; }
    var duration = 1200;
    var start = null;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if(progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ animateCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold:0.4 });
    counters.forEach(function(el){ cio.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  // ---- Active nav link highlighting ----
  var current = (window.location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function(a){
    var href = a.getAttribute('href');
    if(href === current || (current === '' && href === 'index.html')){
      a.classList.add('active');
    }
  });
})();
