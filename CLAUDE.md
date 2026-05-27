# Vivenda — Documentazione per Claude

## Cos'è Vivenda
PWA (Progressive Web App) per il tracciamento della salute quotidiana su iPhone. App single-file: tutto il codice (HTML, CSS, JS) è in `index.html`. Non usa framework esterni.

## URL produzione
**https://gredai.github.io/vivenda**
Repository: https://github.com/GredAI/vivenda

## File principali
- `index.html` — l'intera app (~8100 righe)
- `sw.js` — Service Worker v4 (cache-first, offline-first)
- `manifest.json` — configurazione PWA
- `V.png` — logo app (usato come apple-touch-icon e nel header)
- `icon-192.png`, `icon-512.png` — icone PWA
- `index.backup-stabile.html` — backup punto di ripristino stabile
- `sw.backup-stabile.js` — backup SW stabile

## Come aggiornare l'app
```bash
cd ~/Documents/Vivenda
git add index.html          # o altri file modificati
git commit -m "descrizione"
git push origin master:main
```
Poi su iPhone: ricarica https://gredai.github.io/vivenda in Safari. Il SW aggiorna la cache in background.

**Nota:** il branch locale si chiama `master`, il remoto `main`. Usare sempre `git push origin master:main`.

## Architettura

### Storage
- Tutti i dati utente sono in **localStorage** dell'iPhone
- Il profilo Home Screen e Safari hanno localStorage separati su iOS
- Nessun backend, nessun cloud (scelta deliberata dell'utente)

### Service Worker (sw.js v4)
- Strategia **cache-first**: serve subito dalla cache, aggiorna in background
- All'install: pre-cacha `/` e `/index.html`
- All'activate: elimina solo le cache vecchie (non quella corrente `vivenda-v4`)
- Offline: l'app funziona completamente senza rete dopo la prima visita

### Autenticazione
Sistema a **due livelli**:
1. **Proprietario**: password principale (min 6 caratteri), accesso completo
2. **Ospite**: password secondaria, accesso limitato al profilo Ospite

Le password sono hashate (`_simpleHash`) e salvate in localStorage. Non recuperabili, solo reimpostabili.

**Portachiavi iOS**: il login usa un `<form>` HTML con `autocomplete="current-password"` + `location.reload()` dopo il login riuscito. Safari rileva il pattern e offre di salvare nel Portachiavi (Face ID).

**Dispositivo fidato**: dopo il primo login, `TRUSTED_KEY='1'` salta la schermata codice ai successivi avvii. "Dimentica dispositivo" in Impostazioni resetta questo flag.

## Funzionalità implementate

### Tab Oggi
- Peso con delta rispetto al giorno precedente
- Allenamento (cardio, pesi, sport, corsi ricorrenti)
- Dieta (colazione, pranzo, cena, spuntini) con stima calorie
- Acqua (litri)
- Farmaci (con terapia ricorrente auto-compilata)
- Ciclo con intensità (Leggero/Medio/Forte) e sintomi (8 chip selezionabili)
- Note giornaliere
- Bottone Salva: verde di default, arancione quando ci sono modifiche non salvate
- Widget riassunto settimana (acqua, allenamenti, calorie)

### Tab Progressi
- Grafico calorie (barre raggruppate: introdotte/bruciate/bilancio)
- Grafico spese mensili (ultimi 6 mesi)
- Statistiche ciclo (cicli tracciati, durata media, flusso medio)
- Correlazione peso nel tempo

### Tab Agenda / Rapido
- Inserimento rapido dati
- Note indicizzate

### Impostazioni
- Cambio codice proprietario e ospite
- Esportazione dati: JSON (backup), CSV diario, CSV spese
- Importazione da file JSON o testo incollato
- Portachiavi: pulsante "Dimentica dispositivo" per tornare alla schermata login
- Promemoria backup automatico (banner dopo 7 giorni dall'ultimo backup)
- Gestione profili (multi-profilo con PIN)

## Punto di ripristino stabile (27 maggio 2026)
I file `index.backup-stabile.html` e `sw.backup-stabile.js` rappresentano la versione stabile verificata su iPhone. Per ripristinare:
```bash
cd ~/Documents/Vivenda
cp index.backup-stabile.html index.html
cp sw.backup-stabile.js sw.js
git add index.html sw.js
git commit -m "Ripristino versione stabile"
git push origin master:main
```

## Problemi risolti (storico)
- **Schermata bianca Home Screen**: causata da un blocco IIFE in index.html che cancellava la cache SW ad ogni avvio. Rimosso definitivamente.
- **Dipendenza dal Mac/rete locale**: risolta tornando a GitHub Pages (HTTPS) + SW cache-first.
- **SW network-first**: sostituito con cache-first — l'app non aspetta più la rete per aprirsi.
- **Icona grigia Home Screen**: V.png e icon-192/512.png non erano committati su GitHub.

## Roadmap residua
- Correlazione ciclo/peso nel grafico Progressi
- Esportazione PDF riepilogo mensile
- Tema colore personalizzabile

## Note importanti
- L'utente NON vuole iCloud (spazio pieno)
- I backup vengono scaricati come file JSON con data nel nome (es. `vivenda_backup_2026-05-27.json`)
- Il repository GitHub è pubblico (il codice è visibile, i dati restano sul dispositivo)
- Non eliminare mai l'icona Home Screen senza prima esportare i dati — iOS cancella il localStorage del profilo PWA
