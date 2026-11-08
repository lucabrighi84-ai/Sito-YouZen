(() => {
  document.querySelectorAll('[data-channel]').forEach(button => button.addEventListener('click', () => {
    const channel = button.dataset.channel;
    document.querySelectorAll('[data-channel]').forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.channel === channel)));
    document.querySelectorAll('[data-channel-view]').forEach(view => { view.hidden = view.dataset.channelView !== channel; });
  }));
  document.querySelectorAll('[data-slot]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-slot]').forEach(slot => slot.setAttribute('aria-pressed', String(slot === button)));
    document.querySelector('[data-book-feedback]').textContent = 'Hai scelto le ' + button.textContent + '. Conferma per continuare.';
    document.querySelector('[data-book]').disabled = false;
    document.querySelector('[data-book]').textContent = 'Conferma la prenotazione ↗';
  }));
  document.querySelector('[data-book]').addEventListener('click', event => {
    const slot = document.querySelector('[data-slot][aria-pressed="true"]').textContent;
    document.querySelector('[data-book-feedback]').textContent = 'Esempio confermato: venerdì 13 novembre, ore ' + slot + ', 2 persone.';
    event.currentTarget.textContent = 'Prenotazione confermata ✓';
    event.currentTarget.disabled = true;
  });
  document.querySelectorAll('[data-agenda]').forEach(button => button.addEventListener('click', () => {
    const restaurant = button.dataset.agenda === 'restaurant';
    document.querySelector('[data-calendar]').hidden = restaurant;
    document.querySelector('[data-tables]').hidden = !restaurant;
    document.querySelectorAll('[data-agenda]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
  }));
  document.querySelector('[data-pay]').addEventListener('click', event => {
    const paid = event.currentTarget.getAttribute('aria-pressed') !== 'true';
    event.currentTarget.setAttribute('aria-pressed', String(paid));
    event.currentTarget.textContent = paid ? 'Ricomincia ↺' : 'Prova il pagamento →';
    const status = document.querySelector('[data-payment-status]');
    status.textContent = paid ? 'Pagamento confermato · Esempio' : 'In attesa di pagamento';
    status.classList.toggle('paid', paid);
  });
})();
