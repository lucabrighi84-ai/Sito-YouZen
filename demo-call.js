(() => {
  'use strict';
  const form = document.getElementById('demoCallForm');
  if (!form) return;
  const field = key => document.getElementById('dc-' + key);
  const put = (id, text) => { document.getElementById(id).textContent = text; };
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('yp-form-status');
  const sectors = ['food', 'legale', 'medico', 'beauty', 'pmi', 'finance', 'artigiani', 'realestate'];
  // Same endpoint, sector keys and payload as the original demo form.
  const webhook = 'https://automate.autocalls.ai/api/v1/webhooks/vtqYxeo58vqqRFbIc5Auh';
  let pending = false, sent = false;

  function notice(text, success = false) {
    status.textContent = text;
    status.classList.toggle('success', success);
    status.hidden = false;
  }
  function render(clear = true) {
    if (pending) return;
    button.disabled = sent;
    put('yp-submit-label', sent ? 'Richiesta inviata' : 'Chiamami ora');
    put('yp-demo-promise', 'Lascia il numero. Ti chiama YouZen in 60 secondi, non un venditore.');
    put('yp-form-note', 'Riceverai una chiamata demo entro 60 secondi. Nessun costo, nessun impegno.');
    if (clear) status.hidden = true;
  }
  function invalid(key, text) {
    const input = field(key);
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'yp-form-status');
    notice(text);
    input.focus();
  }
  function changed() { if (!pending) { sent = false; render(); } }
  form.addEventListener('yp:sectorchange', changed);
  form.addEventListener('input', event => {
    event.target.removeAttribute('aria-invalid');
    event.target.removeAttribute('aria-describedby');
    changed();
  });
  form.addEventListener('change', changed);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || sent) return;
    const settore = field('settore').value;
    const name = field('name').value.trim();
    const email = field('email').value.trim();
    // Accept the local number or an explicitly pasted Italian country code.
    const national = field('phone').value.trim().replace(/[\s().-]/g, '').replace(/^(?:\+39|0039)/, '');
    if (!name) return invalid('name', 'Inserisci il tuo nome.');
    if (!email || !field('email').checkValidity()) return invalid('email', 'Inserisci un indirizzo email valido.');
    if (!/^\d{6,11}$/.test(national)) return invalid('phone', 'Inserisci un numero italiano valido, con o senza il prefisso +39.');
    if (!sectors.includes(settore)) return invalid('settore', 'Seleziona il tuo settore.');
    if (!field('privacy').checked) return invalid('privacy', 'Per richiedere la demo, accetta la privacy policy e il contatto.');

    pending = true;
    status.hidden = true;
    form.setAttribute('aria-busy', 'true');
    const controls = [...form.querySelectorAll('input,select,button')];
    controls.forEach(control => { control.disabled = true; });
    put('yp-submit-label', 'Invio in corso…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: '+39' + national, settore, source: 'youzen-demo-call' }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      sent = true;
      notice('Richiesta inviata. Tieni il telefono vicino: la chiamata demo è prevista entro 60 secondi.', true);
      if (typeof gtag === 'function') {
        try { gtag('event', 'demo_call_request', { settore, source: 'demo-call-form' }); } catch (_) { /* Tracking must not affect the request. */ }
      }
    } catch (error) {
      notice(error.name === 'AbortError' || error instanceof TypeError
        ? 'Non abbiamo ricevuto conferma dell’invio. Attendi un minuto prima di riprovare: la richiesta potrebbe essere già arrivata. Per assistenza scrivi a info@youzen.it.'
        : 'Il servizio non ha confermato la richiesta. Riprova tra poco oppure scrivi a info@youzen.it.');
    } finally {
      clearTimeout(timeout);
      pending = false;
      form.removeAttribute('aria-busy');
      controls.forEach(control => { control.disabled = false; });
      render(false);
    }
  });

  const requested = new URLSearchParams(window.location.search).get('settore');
  if (sectors.includes(requested)) field('settore').value = requested;
  render();
})();
