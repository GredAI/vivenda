# Vivenda — Documentazione per Claude

## Cos'è Vivenda
PWA (Progressive Web App) per il tracciamento della salute quotidiana su iPhone. App single-file: tutto il codice (HTML, CSS, JS) è in `index.html`. Non usa framework esterni.

## URL produzione
**https://gredai.github.io/vivenda**
Repository: https://github.com/GredAI/vivenda

## File principali
- `index.html` — l'intera app (~8300 righe)
- `sw.js` — Service Worker v7 (network-first per HTML, cache-first per assets)
- `manifest.json` — configurazione PWA
- `V.png` — logo app (usato come apple-touch-icon e nel header)
- `icon-192.png`, `icon-512.png` — icone PWA
- `index.backup-stabile.html` — backup punto di ripristino stabile (locale, in .gitignore)
- `sw.backup-stabile.js` — backup SW stabile (locale, in .gitignore)

## Come aggiornare l'app
```bash
cd ~/Documents/Vivenda
git add index.html          # o altri file modificati
git commit -m "descrizione"
git push origin master:main
```
Poi su iPhone: ricarica https://gredai.github.io/vivenda in Safari. Il SW aggiorna la cache.

**Nota:** il branch locale si chiama `master`, il remoto `main`. Usare sempre `git push origin master:main`.

**CRITICO — modifiche a index.html:** Claude Edit/Write non scrivono su disco Mac in modo affidabile. Usare sempre `python3` via bash per modificare index.html, poi `git add/commit/push` dal Terminale.

**Lock file git:** se appare l'errore HEAD.lock, rimuoverlo con:
```bash
rm /Users/glauco/Documents/Vivenda/.git/HEAD.lock
```

## Architettura

### Storage
- Tutti i dati utente sono in **localStorage** del browser/dispositivo
- Chiavi profilo-specifiche: `vivenda_{profileId}_{nomeChiave}` (es. `vivenda_giulia_spesa_lista`)
- Chiavi globali (profili, sessione, codici): `vivenda__{nomeChiave}` (doppio underscore)
- Il profilo Home Screen e Safari hanno **localStorage separati** su iOS
- Nessun backend, nessun cloud (scelta deliberata dell'utente)

### Service Worker (sw.js v7)
- **Network-first per HTML**: ogni apertura con rete carica la versione più recente
- **Cache-first per assets**: immagini e file statici serviti dalla cache
- All'activate: forza reload di tutti i client aperti (client.navigate)
- Offline: funziona completamente dopo la prima visita con rete
- Per forzare aggiornamento: Impostazioni → Profilo attivo → **🔄 Aggiorna app**

### Autenticazione
Sistema a **due livelli**:
1. **Livello 1 — Codice app**: schermata iniziale. Il proprietario imposta un codice (min 6 caratteri). Gli ospiti usano un codice separato (min 4 caratteri). Entrambi hashati con `_simpleHash` in localStorage.
2. **Livello 2 — Profili con PIN**: dopo aver passato il livello 1, si sceglie il profilo e si inserisce il PIN (4 cifre).

**Costanti chiave:**
- `APP_CODE_KEY = 'vivenda__appCode'` — hash codice proprietario
- `OSPITE_CODE_KEY = 'vivenda__ospiteCode'` — hash codice ospite
- `TRUSTED_KEY = 'vivenda__trusted'` — dispositivo fidato (salta livello 1)
- `TRUSTED_ROLE_KEY = 'vivenda__trustedRole'` — 'owner' | 'guest'
- `PROFILES_KEY = 'vivenda__profiles'` — array profili
- `SESSION_KEY = 'vivenda__session'` — ultimo profilo loggato

**Flusso owner (trusted):** `initLogin()` → `SESSION_KEY` valido → `loginSuccess(p)` diretto.
**Flusso guest (trusted):** `initLogin()` → `_loginDirettoOspite()` → se `pin===null` mostra setup genere+PIN, altrimenti `loginSuccess(ospite)` diretto.

**Portachiavi iOS**: login usa `<form autocomplete="on">` + `location.reload()` dopo login. Safari offre di salvare nel Portachiavi (Face ID).
**Dispositivo fidato**: `TRUSTED_KEY='1'` salta la schermata codice. "Dimentica dispositivo" in Impostazioni resetta il flag.

### Lista della spesa — struttura dati
Chiave: `vivenda_{profileId}_spesa_lista`
Formato: array JSON semplice, **solo testo e flag spuntato**:
```json
[
  { "text": "Latte", "done": false },
  { "text": "Pasta", "done": true }
]
```
Import accettati: testo incollato (una riga = un prodotto) o file .txt stesso formato.

## Funzionalità implementate

### Tab Oggi
- Peso con delta rispetto al giorno precedente
- Allenamento: cardio, pesi, sport, corsi ricorrenti (auto-popolati per giorno se corsi non ancora salvati)
- Dieta (colazione, pranzo, cena, spuntini mattina/pomeriggio) con stima calorie
- Acqua (litri)
- Farmaci con terapia ricorrente auto-compilata
- Ciclo con intensità (Leggero/Medio/Forte) e sintomi (8 chip selezionabili)
- Note giornaliere
- Bottone Salva: arancione di default, verde solo dopo salvataggio, torna arancione se si modificano dati
- Widget riassunto settimana (acqua, allenamenti, calorie)
- Previsione ciclo con fase attuale + proiezione 6 mesi espandibile

### Tab Progressi
- Grafico calorie (barre raggruppate: introdotte/bruciate/bilancio)
- Grafico spese mensili (ultimi 6 mesi)
- Statistiche ciclo (cicli tracciati, durata media, flusso medio)
- Correlazione peso/ciclo (grafico peso con giorni ciclo evidenziati, ultimi 90 giorni)

### Tab Agenda / Rapido
- Inserimento rapido dati
- Note indicizzate
- Lista della spesa con import testo/file .txt e modifica inline

### Impostazioni
- Cambio codice proprietario e ospite
- Esportazione: backup JSON, CSV diario, CSV spese, PDF mensile (mese corrente)
- Importazione da file JSON o testo incollato
- Corsi ricorrenti: definizione corsi settimanali + **📋 Importa orario palestra** (carica schedule completo)
- Portachiavi: pulsante "Dimentica dispositivo"
- Promemoria backup automatico (banner dopo 7 giorni dall'ultimo backup)
- Gestione profili multi-profilo con PIN
- Pulsante "🔄 Aggiorna app"

### Corsi palestra (CORSI_TIPI aggiornato)
Include: HIIT, Tabata, ABS, GAG, Legs and Butt, Upper Body, TBW, Zumba, Yoga, Pilates, **Postural, Circuit, EMOM, Pump, Step & Dance, Diva Fitness, Six Pack, Booty Workout, Cardio Tone, Functional Training**, Spinning, Cross Training, Corpo Libero, Boxe, Barre, Stretching, Altro.

## Punto di ripristino stabile (27 maggio 2026 — ore 10:35)
I file `index.backup-stabile.html` e `sw.backup-stabile.js` (locali, non su GitHub) rappresentano la versione stabile pre-sessione settembre 2026. Per ripristinare:
```bash
cd ~/Documents/Vivenda
cp index.backup-stabile.html index.html
cp sw.backup-stabile.js sw.js
git add index.html sw.js
git commit -m "Ripristino versione stabile"
git push origin master:main
```

## Problemi risolti (storico completo)
- **Schermata bianca Home Screen**: blocco IIFE che cancellava la cache SW ad ogni avvio. Rimosso definitivamente.
- **Dipendenza dal Mac/rete locale**: risolta tornando a GitHub Pages (HTTPS) + SW offline-first.
- **SW network-first lento**: sostituito con cache-first (v4), poi aggiornato a v7 network-first per HTML.
- **Icona grigia Home Screen**: V.png e icon-192/512.png non erano committati su GitHub.
- **Portachiavi iOS**: `prompt()` bloccato in PWA → sostituito con `<form autocomplete>` + reload.
- **Zoom doppio tap su lista spesa**: risolto con `touch-action: manipulation` sul CSS degli item.
- **Schermata rossa "Script error."**: causata da `prompt()` rimasto in `esportaPDFMensile()` e in modifica lista spesa. Rimossi tutti i `prompt()` — zero residui.
- **Tastierini PIN Ospite/Admin**: usavano classi CSS inesistenti (`pk-btn`, `pin-grid`, `pin-keyboard`) → uniformati a `pin-key` / `pin-keypad` con griglia 3×4 corretta.
- **Profilo personale cancellato**: `_eseguiResetProfiliV2()` era una funzione migrazione che eliminava tutti i profili personali. Neutralizzata (ora è no-op che imposta solo il flag).
- **Guest trusted salta setup**: `_loginDirettoOspite()` chiamava `loginSuccess` anche con `pin===null`. Ora verifica: se `pin===null` mostra il setup genere+PIN.
- **Tema colore**: implementato poi rimosso (causava conflitti visivi e duplicazione colori).

## Note importanti
- L'utente NON vuole iCloud (spazio pieno)
- I backup sono file JSON con data nel nome (es. `vivenda_backup_2026-09-21.json`)
- Il repository GitHub è pubblico (codice visibile, dati restano sul dispositivo)
- Non eliminare mai l'icona Home Screen senza prima esportare i dati — iOS cancella il localStorage PWA
- Aggiungere a Home Screen: Safari → pulsante condividi (↑) → "Visualizza altro" → "Aggiungi alla schermata Home"
- Integrazione con app esterne (es. Cookit): può scrivere in `vivenda_{profileId}_spesa_lista` con formato `[{text, done}]` se stesso origin/localStorage; altrimenti usare export .txt una riga per prodotto
