(() => {
  const root = document.querySelector(".homepage-service-slides");
  if (!root) return;
  root.querySelectorAll('[data-channel]').forEach(button => button.addEventListener('click', () => {
    const channel = button.dataset.channel;
    root.querySelectorAll('[data-channel]').forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.channel === channel)));
    root.querySelectorAll('[data-channel-view]').forEach(view => { view.hidden = view.dataset.channelView !== channel; });
  }));
  root.querySelectorAll('[data-slot]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-slot]').forEach(slot => slot.setAttribute('aria-pressed', String(slot === button)));
    root.querySelector('[data-book-feedback]').textContent = 'Hai scelto le ' + button.textContent + '. Conferma per continuare.';
    root.querySelector('[data-book]').disabled = false;
    root.querySelector('[data-book]').textContent = 'Conferma la prenotazione ↗';
  }));
  root.querySelector('[data-book]').addEventListener('click', event => {
    const slot = root.querySelector('[data-slot][aria-pressed="true"]').textContent;
    root.querySelector('[data-book-feedback]').textContent = 'Esempio confermato: venerdì 13 novembre, ore ' + slot + ', 2 persone.';
    event.currentTarget.textContent = 'Prenotazione confermata ✓';
    event.currentTarget.disabled = true;
  });
  root.querySelectorAll('[data-agenda]').forEach(button => button.addEventListener('click', () => {
    const restaurant = button.dataset.agenda === 'restaurant';
    root.querySelector('[data-calendar]').hidden = restaurant;
    root.querySelector('[data-tables]').hidden = !restaurant;
    root.querySelectorAll('[data-agenda]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
  }));
  root.querySelector('[data-pay]').addEventListener('click', event => {
    const paid = event.currentTarget.getAttribute('aria-pressed') !== 'true';
    event.currentTarget.setAttribute('aria-pressed', String(paid));
    event.currentTarget.textContent = paid ? 'Ricomincia ↺' : 'Prova il pagamento →';
    const status = root.querySelector('[data-payment-status]');
    status.textContent = paid ? 'Pagamento confermato · Esempio' : 'In attesa di pagamento';
    status.classList.toggle('paid', paid);
  });
})();
