(() => {
  'use strict';

  function init() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1024px)');
    const header = document.getElementById('site-header');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    const modalLocks = new Set();
    let pageOverflow = '';

    function lockModal(modal) {
      if (!modalLocks.size) pageOverflow = document.body.style.overflow;
      modalLocks.add(modal);
      document.body.style.overflow = 'hidden';
    }

    function unlockModal(modal) {
      if (!modalLocks.delete(modal)) return;
      document.body.style.overflow = modalLocks.size ? 'hidden' : pageOverflow;
    }

    function restoreModalFocus(opener) {
      if (!document.querySelector('dialog[open]') && opener?.isConnected) {
        opener.focus({ preventScroll: true });
      }
    }

    function trapModalFocus(modal, event) {
      if (event.key !== 'Tab') return;
      const focusable = [...modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
        .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function closeMenu(restoreFocus = false) {
      if (!menuToggle || !mobileMenu) return;
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
      document.body.classList.remove('menu-open');
      if (restoreFocus) menuToggle.focus();
    }

    if (menuToggle && mobileMenu) {
      if (!mobileMenu.id) mobileMenu.id = 'mobile-navigation';
      menuToggle.setAttribute('aria-controls', mobileMenu.id);
      closeMenu();
      menuToggle.addEventListener('click', () => {
        const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!isOpen));
        mobileMenu.hidden = isOpen;
        document.body.classList.toggle('menu-open', !isOpen);
      });
      mobileMenu.addEventListener('click', (event) => {
        if (event.target.closest('a, [data-open-demo]')) closeMenu();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !mobileMenu.hidden) closeMenu(true);
      });
      desktop.addEventListener('change', () => {
        if (desktop.matches) closeMenu();
      });
    }

    const navDropdowns = [...document.querySelectorAll('details.nav-dropdown')];
    function closeDropdowns() {
      navDropdowns.forEach((dropdown) => { dropdown.open = false; });
    }
    navDropdowns.forEach((dropdown) => {
      dropdown.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeDropdowns();
      });
      dropdown.addEventListener('toggle', () => {
        if (dropdown.open) {
          navDropdowns.forEach((other) => {
            if (other !== dropdown) other.open = false;
          });
        }
      });
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('details.nav-dropdown')) closeDropdowns();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const focusedDropdown = navDropdowns.find((dropdown) => dropdown.open && dropdown.contains(document.activeElement));
      closeDropdowns();
      focusedDropdown?.querySelector('summary')?.focus();
    });

    document.querySelectorAll('[data-tabs]').forEach((group, groupIndex) => {
      const tabs = [...group.querySelectorAll('button[data-tab]')]
        .filter((tab) => tab.closest('[data-tabs]') === group);
      const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
      if (!tabs.length) return;

      function showTabInHorizontalList(tab) {
        const list = tab.closest('[role="tablist"]');
        if (!list || list.scrollWidth <= list.clientWidth) return;
        const listRect = list.getBoundingClientRect();
        const tabRect = tab.getBoundingClientRect();
        let left = list.scrollLeft;
        if (tabRect.left < listRect.left) left += tabRect.left - listRect.left - 8;
        else if (tabRect.right > listRect.right) left += tabRect.right - listRect.right + 8;
        else return;
        list.scrollTo({ left, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      }

      function selectTab(index, focus = false, showTab = true) {
        if (!tabs[index]) return;
        tabs.forEach((tab, tabIndex) => {
          const selected = tabIndex === index;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          tab.classList.toggle('is-active', selected);
          if (panels[tabIndex]) {
            panels[tabIndex].hidden = !selected;
            panels[tabIndex].classList.toggle('is-active', selected);
          }
        });
        if (group.dataset.tabs === 'sectors') {
          const tab = tabs[index];
          document.body.dataset.sector = tab.dataset.sector || tab.dataset.tab || panels[index]?.id || '';
        }
        if (focus) tabs[index].focus({ preventScroll: true });
        if (showTab) showTabInHorizontalList(tabs[index]);
        group.dispatchEvent(new CustomEvent('youzen:tabchange', {
          bubbles: true,
          detail: { group: group.dataset.tabs, index, panelId: panels[index]?.id || null },
        }));
      }

      tabs.forEach((tab, index) => {
        tab.setAttribute('role', 'tab');
        if (!tab.id) tab.id = `youzen-tab-${groupIndex}-${index}`;
        if (panels[index]) {
          panels[index].setAttribute('role', 'tabpanel');
          panels[index].setAttribute('aria-labelledby', tab.id);
        }
        tab.addEventListener('click', () => selectTab(index));
        tab.addEventListener('keydown', (event) => {
          let nextIndex;
          if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
          if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
          if (event.key === 'Home') nextIndex = 0;
          if (event.key === 'End') nextIndex = tabs.length - 1;
          if (nextIndex !== undefined) {
            event.preventDefault();
            selectTab(nextIndex, true);
          }
        });
      });
      const initialIndex = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
      selectTab(initialIndex >= 0 ? initialIndex : 0, false, false);
    });

    const toolDialog = document.getElementById('tool-dialog');
    const toolDialogTitle = document.getElementById('tool-dialog-title');
    const toolDetails = {
      booking: { panel: 'booking', title: 'Prenotazioni e booking web' },
      agenda: { panel: 'agenda', title: 'Agenda e team' },
      orders: { panel: 'orders', title: 'Gestione intelligente delle comande' },
      mobile: { panel: 'orders', title: 'App mobile per le comande' },
      crm: { panel: 'crm', title: 'CRM omnicanale' },
      payments: { panel: 'payments', title: 'Cassa, pagamenti e documenti' },
      voice: {
        panel: 'crm', title: 'CRM omnicanale · Voce AI',
        heading: 'Una risposta al telefono. Una storia nel CRM.',
        description: 'L’assistente telefonico AI risponde 24/7 sul numero della tua attività, gestisce più chiamate in parallelo e riconosce i clienti dal numero. Passa al team le richieste che richiedono una persona e registra trascrizione ed esito nella scheda cliente.',
      },
    };
    const crmFocusTitle = toolDialog?.querySelector('[data-crm-focus-title]');
    const crmFocusDescription = toolDialog?.querySelector('[data-crm-focus-description]');
    const crmOriginalTitle = crmFocusTitle?.innerHTML;
    const crmOriginalDescription = crmFocusDescription?.textContent;
    let toolOpener;
    let toolRestoreFocus = true;

    function openTool(key, opener) {
      const details = toolDetails[key];
      const panel = details && document.getElementById(`panel-${details.panel}`);
      if (!toolDialog || !panel || !toolDialog.contains(panel)) return false;
      if (document.getElementById('demo-dialog')?.hasAttribute('open')) return false;
      const alreadyOpen = toolDialog.hasAttribute('open');
      if (!alreadyOpen || !toolDialog.contains(opener)) toolOpener = opener;
      toolRestoreFocus = true;
      closeMenu();
      closeDropdowns();
      toolDialog.querySelectorAll('.tool-panel').forEach((item) => {
        item.hidden = item !== panel;
        item.classList.toggle('is-active', item === panel);
      });
      if (toolDialogTitle) toolDialogTitle.textContent = details.title;
      if (crmFocusTitle) {
        if (details.heading) crmFocusTitle.textContent = details.heading;
        else crmFocusTitle.innerHTML = crmOriginalTitle;
      }
      if (crmFocusDescription) crmFocusDescription.textContent = details.description || crmOriginalDescription;
      toolDialog.dataset.activeTool = key;
      if (!alreadyOpen) {
        lockModal(toolDialog);
        if (typeof toolDialog.showModal === 'function') toolDialog.showModal();
        else toolDialog.setAttribute('open', '');
      }
      toolDialog.scrollTo({ top: 0, behavior: 'instant' });
      toolDialog.querySelector('[data-close-tool]')?.focus({ preventScroll: true });
      return true;
    }

    function closeTool(restoreFocus = true) {
      if (!toolDialog?.hasAttribute('open')) return;
      toolRestoreFocus = restoreFocus;
      if (typeof toolDialog.close === 'function') toolDialog.close();
      else {
        toolDialog.removeAttribute('open');
        if (restoreFocus) restoreModalFocus(toolOpener);
      }
      unlockModal(toolDialog);
    }

    if (toolDialog) {
      document.querySelectorAll('[data-tool-open]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          openTool(button.dataset.toolOpen, button);
        });
      });
      toolDialog.querySelectorAll('[data-close-tool]').forEach((button) => {
        button.addEventListener('click', () => closeTool());
      });
      toolDialog.addEventListener('click', (event) => {
        const sectionLink = event.target.closest('a[href^="#"]');
        if (sectionLink && sectionLink.hash.length > 1 && !event.defaultPrevented) {
          closeTool(false);
          return;
        }
        if (event.target !== toolDialog) return;
        const rect = toolDialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          closeTool();
        }
      });
      toolDialog.addEventListener('close', () => {
        if (toolDialog.hasAttribute('open')) return;
        unlockModal(toolDialog);
        if (toolRestoreFocus) restoreModalFocus(toolOpener);
        toolRestoreFocus = true;
      });
      toolDialog.addEventListener('cancel', () => { toolRestoreFocus = true; });
      toolDialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && typeof toolDialog.close !== 'function') closeTool();
        trapModalFocus(toolDialog, event);
      });
    }

    document.querySelectorAll('[data-tool-link]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (openTool(link.dataset.toolLink, link)) event.preventDefault();
      });
    });
    const sectorNames = new Set(['restaurant', 'salon']);
    document.querySelectorAll('[data-sector-link]').forEach((link) => {
      link.addEventListener('click', () => {
        if (sectorNames.has(link.dataset.sectorLink)) document.getElementById(`tab-${link.dataset.sectorLink}`)?.click();
      });
    });

    const reveals = [...document.querySelectorAll('[data-reveal]')];
    let revealObserver;
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      reveals.forEach((element) => revealObserver.observe(element));
    } else {
      reveals.forEach((element) => element.classList.add('is-visible'));
    }
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        revealObserver?.disconnect();
        reveals.forEach((element) => element.classList.add('is-visible'));
      }
    });

    const parallaxElements = [...document.querySelectorAll('[data-parallax]')];
    let parallaxPositions = [];
    let scrollFrame = 0;

    function measureParallax() {
      parallaxPositions = parallaxElements.map((element) => {
        element.style.setProperty('--parallax-y', '0px');
        const rect = element.getBoundingClientRect();
        const parsedSpeed = Number.parseFloat(element.dataset.parallax);
        return {
          element,
          center: rect.top + window.scrollY + rect.height / 2,
          speed: Number.isFinite(parsedSpeed) ? Math.min(Math.max(parsedSpeed, -0.25), 0.25) : 0.06,
        };
      });
    }

    function updateScroll() {
      scrollFrame = 0;
      header?.classList.toggle('is-scrolled', window.scrollY > 40);
      const enabled = desktop.matches && !reducedMotion.matches;
      parallaxPositions.forEach(({ element, center, speed }) => {
        const offset = enabled
          ? Math.max(-85, Math.min(85, (window.scrollY + window.innerHeight / 2 - center) * speed))
          : 0;
        element.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
      });
    }

    function scheduleScroll() {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
    }

    measureParallax();
    updateScroll();
    window.addEventListener('scroll', scheduleScroll, { passive: true });
    window.addEventListener('resize', () => { measureParallax(); scheduleScroll(); }, { passive: true });
    window.addEventListener('load', () => { measureParallax(); scheduleScroll(); }, { once: true });
    reducedMotion.addEventListener('change', scheduleScroll);
    desktop.addEventListener('change', () => { measureParallax(); scheduleScroll(); });
    document.addEventListener('youzen:tabchange', () => { measureParallax(); scheduleScroll(); });

    document.querySelectorAll('[data-rotating-word]').forEach((element) => {
      const words = element.dataset.words?.split('|').map((word) => word.trim()).filter(Boolean)
        || ['ristorante.', 'salone.'];
      if (words.length < 2) return;
      let index = Math.max(0, words.indexOf(element.textContent.trim()));
      let inViewport = true;
      let timer;
      let animation;
      let generation = 0;

      function canRotate() {
        return inViewport && !document.hidden && !reducedMotion.matches;
      }

      function pause() {
        window.clearTimeout(timer);
        animation?.cancel();
        generation += 1;
      }

      function scheduleWord() {
        window.clearTimeout(timer);
        if (!canRotate()) return;
        timer = window.setTimeout(async () => {
          const currentGeneration = generation;
          if (typeof element.animate === 'function') {
            animation = element.animate(
              [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-7px)' }],
              { duration: 180, easing: 'ease-in', fill: 'forwards' },
            );
            await animation.finished.catch(() => {});
          }
          if (!canRotate() || currentGeneration !== generation) return;
          index = (index + 1) % words.length;
          element.textContent = words[index];
          animation?.cancel();
          if (typeof element.animate === 'function') {
            animation = element.animate(
              [{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }],
              { duration: 280, easing: 'cubic-bezier(.2,.7,.3,1)' },
            );
          }
          scheduleWord();
        }, 4000);
      }

      function refreshRotation() {
        pause();
        scheduleWord();
      }

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          inViewport = entry.isIntersecting;
          refreshRotation();
        }).observe(element);
      }
      document.addEventListener('visibilitychange', refreshRotation);
      reducedMotion.addEventListener('change', refreshRotation);
      scheduleWord();
    });

    const dialog = document.getElementById('demo-dialog');
    const demoForm = document.getElementById('demo-form');
    let dialogOpener;

    function closeDialog() {
      if (!dialog?.hasAttribute('open')) return;
      if (typeof dialog.close === 'function') dialog.close();
      else {
        dialog.removeAttribute('open');
        restoreAfterDialog();
      }
    }

    function restoreAfterDialog() {
      if (dialog?.hasAttribute('open')) return;
      unlockModal(dialog);
      restoreModalFocus(dialogOpener);
    }

    if (dialog) {
      document.querySelectorAll('[data-open-demo]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          if (dialog.hasAttribute('open')) return;
          dialogOpener = toolDialog?.hasAttribute('open') && toolDialog.contains(button)
            ? toolOpener : button;
          closeTool(false);
          closeMenu();
          lockModal(dialog);
          if (demoForm && button.dataset.demoInterest) {
            const interest = demoForm.elements.namedItem('interest');
            if (interest) interest.value = button.dataset.demoInterest;
          }
          if (typeof dialog.showModal === 'function') dialog.showModal();
          else {
            dialog.setAttribute('open', '');
            dialog.querySelector('input, select, button, a[href]')?.focus();
          }
        });
      });
      dialog.querySelectorAll('[data-close-demo]').forEach((button) => {
        button.addEventListener('click', closeDialog);
      });
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          closeDialog();
        }
      });
      dialog.addEventListener('close', restoreAfterDialog);
      dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && typeof dialog.close !== 'function') closeDialog();
        trapModalFocus(dialog, event);
      });
    }

    if (demoForm) {
      demoForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!demoForm.reportValidity()) return;
        const result = document.getElementById('demo-result');
        if (!result) return;
        const fields = [
          ['name', 'Nome'], ['email', 'Email'], ['business', 'Attività'],
          ['sector', 'Settore'], ['interest', 'Interesse'],
        ];
        const data = new FormData(demoForm);
        const summaryLines = fields.map(([key, label]) => {
          const control = demoForm.elements.namedItem(key);
          const value = control?.tagName === 'SELECT'
            ? control.selectedOptions[0]?.textContent.trim()
            : String(data.get(key) || '').trim();
          return `${label}: ${value || 'Non specificato'}`;
        });
        const email = demoForm.dataset.contactEmail?.trim();
        const hasContact = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        result.replaceChildren();
        const message = document.createElement('p');
        message.textContent = hasContact
          ? 'Riepilogo pronto. Apri la tua email per inviarlo.'
          : 'Riepilogo pronto. Questo esempio non invia dati: puoi usare il riepilogo qui sotto.';
        const summary = document.createElement('p');
        summary.className = 'demo-summary';
        summary.style.whiteSpace = 'pre-line';
        summary.textContent = summaryLines.join('\n');
        result.append(message, summary);
        if (hasContact) {
          const emailLink = document.createElement('a');
          emailLink.className = 'button button-primary demo-email-link';
          emailLink.textContent = 'Apri la tua email';
          emailLink.href = `mailto:${email}?subject=${encodeURIComponent('Richiesta demo YouZen')}&body=${encodeURIComponent(`Ciao, vorrei scoprire YouZen per la mia attività.\n\n${summaryLines.join('\n')}`)}`;
          result.append(emailLink);
        }
        result.hidden = false;
        result.setAttribute('role', 'status');
        result.tabIndex = -1;
        result.focus({ preventScroll: true });
        result.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
      });
    }

    document.querySelectorAll('[data-kds-ready]').forEach((button) => {
      const originalHTML = button.innerHTML;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        const card = button.closest('[data-kds-card]');
        if (!card) return;
        const ready = card.dataset.ready !== 'true';
        card.dataset.ready = String(ready);
        card.classList.toggle('is-ready', ready);
        const status = card.querySelector('[data-kds-status]');
        if (status) {
          status.textContent = ready ? 'Pronto al servizio' : 'In preparazione';
          status.setAttribute('aria-live', 'polite');
        }
        if (ready) button.textContent = 'Ricomincia';
        else button.innerHTML = originalHTML;
        button.setAttribute('aria-pressed', String(ready));
      });
    });

    document.querySelectorAll('[data-booking-preview]').forEach((preview) => {
      const slots = [...preview.querySelectorAll('[data-slot]')];
      if (!slots.length) return;
      let selectedSlot = slots.find((slot) => slot.getAttribute('aria-pressed') === 'true') || slots[0];
      function selectSlot(slot) {
        selectedSlot = slot;
        slots.forEach((item) => {
          item.setAttribute('aria-pressed', String(item === slot));
          item.classList.toggle('is-selected', item === slot);
        });
        const result = preview.querySelector('[data-booking-result]');
        if (result) {
          result.textContent = 'Una prova interattiva, senza inviare dati.';
          result.hidden = false;
        }
      }
      slots.forEach((slot) => slot.addEventListener('click', () => selectSlot(slot)));
      selectSlot(selectedSlot);
      preview.querySelector('[data-booking-confirm]')?.addEventListener('click', () => {
        const result = preview.querySelector('[data-booking-result]');
        if (!result || !selectedSlot) return;
        result.textContent = `Esempio: prenotazione confermata per le ${selectedSlot.dataset.slot || selectedSlot.textContent.trim()}. La disponibilità è aggiornata nel gestionale.`;
        result.hidden = false;
        result.setAttribute('role', 'status');
      });
    });

    document.documentElement.classList.add('js');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
