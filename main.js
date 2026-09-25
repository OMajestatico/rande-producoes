(() => {
  const root = document.documentElement;
  const body = document.body;
  const themeBtn = document.getElementById('themeBtn');
  const menuBtn = document.getElementById('menuBtn');
  const menuClose = document.getElementById('menuClose');
  const menuOverlay = document.getElementById('menuOverlay');
  const topbar = document.getElementById('topbar');

  const icon = (name) => {
    if (window.lucide) window.lucide.createIcons({attrs:{'stroke-width':1.7}});
  };
  icon();

  // Theme: first load follows the device time; after that, the visitor toggles only light/dark.
  let themeMode = localStorage.getItem('rande-theme');
  if (!themeMode) themeMode = (new Date().getHours() >= 18 || new Date().getHours() < 6) ? 'dark' : 'light';
  const themeLabels = {light:'Claro', dark:'Escuro'};
  const themeIcons = {light:'sun', dark:'moon'};

  function renderThemeButton() {
    if (!themeBtn) return;
    themeBtn.innerHTML = `<i data-lucide="${themeIcons[themeMode]}"></i><span class="desktop-only">${themeLabels[themeMode]}</span>`;
    icon();
  }

  function applyTheme() {
    root.dataset.theme = themeMode;
    renderThemeButton();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeMode === 'dark' ? '#0a0a0b' : '#f3f0e8');
  }
  themeBtn?.addEventListener('click', () => {
    themeMode = themeMode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('rande-theme', themeMode);
    applyTheme();
  });
  applyTheme();


  // Full-screen menu without the classic scroll-jump crime.
  let lockedY = 0;
  function openMenu() {
    lockedY = window.scrollY;
    body.classList.add('menu-locked');
    body.style.top = `-${lockedY}px`;
    menuOverlay.classList.add('is-open');
    menuOverlay.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    if (!menuOverlay.classList.contains('is-open')) return;
    menuOverlay.classList.remove('is-open');
    menuOverlay.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-locked');
    body.style.top = '';
    window.scrollTo(0, lockedY);
  }
  menuBtn?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  menuOverlay?.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
    const target = a.getAttribute('href');
    closeMenu();
    requestAnimationFrame(() => document.querySelector(target)?.scrollIntoView({behavior:'smooth'}));
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // Reveal-on-view using transforms only.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold:.12, rootMargin:'0px 0px -5%'});
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Carousels with native touch scroll + dots.
  document.querySelectorAll('.snap-track[data-dots]').forEach(track => {
    const items = [...track.querySelectorAll('.snap-item')];
    const dots = document.getElementById(track.dataset.dots);
    if (!items.length || !dots) return;
    items.forEach((item, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Ir para projeto ${idx + 1}`);
      if (idx === 0) b.classList.add('active');
      b.addEventListener('click', () => item.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}));
      dots.appendChild(b);
    });
    let ticking = false;
    const updateDots = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0, dist = Infinity;
      items.forEach((it,i) => {
        const c = it.offsetLeft + it.offsetWidth / 2;
        const d = Math.abs(c-center);
        if (d < dist) {dist=d;best=i;}
      });
      [...dots.children].forEach((d,i) => d.classList.toggle('active',i===best));
      ticking = false;
    };
    track.addEventListener('scroll', () => {
      if (!ticking) {requestAnimationFrame(updateDots);ticking=true;}
    }, {passive:true});
  });

  document.querySelectorAll('[data-carousel-prev]').forEach(btn => btn.addEventListener('click', () => {
    const track = document.getElementById(btn.dataset.carouselPrev);
    track?.scrollBy({left:-Math.min(track.clientWidth*.75,540),behavior:'smooth'});
  }));
  document.querySelectorAll('[data-carousel-next]').forEach(btn => btn.addEventListener('click', () => {
    const track = document.getElementById(btn.dataset.carouselNext);
    track?.scrollBy({left:Math.min(track.clientWidth*.75,540),behavior:'smooth'});
  }));

  // Small 3D tilt on pointer devices only. Mobile gets the calm version.
  const canTilt = matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches;
  if (canTilt) {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      const base = getComputedStyle(el).transform === 'none' ? '' : getComputedStyle(el).transform;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX-r.left)/r.width-.5;
        const y = (e.clientY-r.top)/r.height-.5;
        el.style.transform = `${base} perspective(900px) rotateX(${(-y*5).toFixed(2)}deg) rotateY(${(x*7).toFixed(2)}deg) translateY(-3px)`;
      });
      el.addEventListener('pointerleave', () => el.style.transform = base);
    });
  }

  // Hide the top bar only on deliberate downward scrolling.
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (menuOverlay.classList.contains('is-open')) return;
    if (y > lastY + 18 && y > 180) topbar.classList.add('is-hidden');
    if (y < lastY - 12) topbar.classList.remove('is-hidden');
    lastY = y;
  }, {passive:true});

})();
