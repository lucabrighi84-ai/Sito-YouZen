// Menu del sito per le pagine che non caricano app.js: tendine, menu del telefono, header fisso dopo lo scroll
(() => {
  const header = document.getElementById('site-header');
  if (!header) return;
  const toggle = header.querySelector('[data-menu-toggle]');
  const menu = header.querySelector('[data-mobile-menu]');
  const desktop = matchMedia('(min-width: 1024px)');

  function closeMenu(focus) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    if (focus) toggle.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
      document.body.classList.toggle('menu-open', !open);
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
    desktop.addEventListener('change', () => { if (desktop.matches) closeMenu(); });
  }

  const drops = [...header.querySelectorAll('details.nav-dropdown')];
  const closeDrops = () => drops.forEach((d) => { d.open = false; });
  drops.forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target.closest('a')) closeDrops(); });
    d.addEventListener('toggle', () => { if (d.open) drops.forEach((o) => { if (o !== d) o.open = false; }); });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('details.nav-dropdown')) closeDrops(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (menu && !menu.hidden) closeMenu(true);
    const f = drops.find((d) => d.open && d.contains(document.activeElement));
    closeDrops();
    f?.querySelector('summary')?.focus();
  });

  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
