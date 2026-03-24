# TraVis — Tracker Visite Commerciali

## Struttura file

```
/tracker/
├── index.html          ← Frontend completo (HTML + CSS + JS)
├── api.php             ← Backend PHP per Synology
├── aziende.csv         ← Anagrafica aziende base
├── data/               ← Dati runtime (creata automaticamente)
│   ├── aziende_custom.json
│   └── visite_YYYY-MM-DD.json
└── export/             ← Export generati (creata automaticamente)
```

## Modalità di utilizzo

### 1. Standalone (senza server PHP)
Apri `index.html` nel browser. Tutti i dati vengono salvati in `localStorage`.
Funziona offline, da telefono, da desktop.

### 2. Su Synology NAS (con PHP)
1. Copia la cartella `tracker/` nella document root del tuo Virtual Host
2. Assicurati che PHP sia abilitato in Web Station
3. Crea le cartelle `data/` e `export/` con permessi di scrittura
4. Accedi via browser all'indirizzo del NAS

## Funzionalità

- **297 aziende** precaricate da CSV
- Ricerca libera su tutti i campi
- Filtri per stato (Tutti / Visitati / Da fare / Preventivo)
- Filtri per città e categoria
- Ordinamento (A-Z, città, categoria, voto, ultima visita)
- Card colorate per stato visita
- Registrazione visita con gradimento a stelle
- Toggle preventivo
- Contatto incontrato e note
- Storico visite completo per azienda
- Modifica anagrafica inline
- Aggiunta/eliminazione aziende
- Import CSV esterno
- Export CSV e XLS delle visite
- Dati agente persistenti
- Statistiche rapide
- UI mobile-first con tema scuro
- Font: DM Sans + Space Grotesk
