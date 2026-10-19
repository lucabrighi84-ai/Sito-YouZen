(function () {
  var parti = location.pathname.split('/');
  if (parti[1] !== 'blog' || !parti[2]) return;
  var articolo = parti[2];
  function consensoConcesso() {
    try {
      return window.localStorage.getItem('yz-consent') === 'granted';
    } catch (e) {
      return false;
    }
  }
  document.addEventListener('click', function (e) {
    var bersaglio = e && e.target;
    var link = bersaglio && typeof bersaglio.closest === 'function' ? bersaglio.closest('a[data-destinazione]') : null;
    if (!link || typeof window.gtag !== 'function' || !consensoConcesso()) return;
    window.gtag('event', 'blog_clic', {
      articolo: articolo,
      destinazione: link.getAttribute('data-destinazione'),
      transport_type: 'beacon'
    });
  });
})();
