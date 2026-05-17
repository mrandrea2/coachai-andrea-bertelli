# Andrea Bertelli Fitness AI Lab

Prima versione della web app per generare schede fitness/palestra personalizzate con AI.

## File inclusi

- `index.html`: app completa lato browser con registrazione locale, anamnesi, progressi, storico schede, pannello coach/admin, timer recupero, chat Andrea IA, privacy/cookie banner e stampa PDF.
- `api/chat.js`: funzione serverless Vercel che usa Anthropic per generare schede, risposte chat e cambi esercizio.
- `vercel.json`: routing per Vercel.

## Variabili Vercel

Imposta su Vercel:

```txt
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

`ANTHROPIC_MODEL` è opzionale: se manca, viene usato `claude-3-5-sonnet-latest`.

## Accesso coach/admin demo

In questa versione i dati sono salvati nel browser con `localStorage`.

- Registra un utente.
- Spunta `Sono Andrea / coach`.
- Usa codice: `AB-COACH`.

Per produzione servono autenticazione server-side e database, ad esempio Supabase, Neon/Postgres, Firebase o Vercel Postgres.

## PDF

Il pulsante `Download PDF` apre la stampa del browser. Seleziona `Salva come PDF`.

## Note privacy e sicurezza

Questa è una base tecnica e grafica. Prima di raccogliere dati reali servono:

- privacy policy completa GDPR;
- consenso esplicito per dati sanitari/sportivi;
- gestione cancellazione/esportazione dati;
- password e sessioni gestite server-side;
- database con regole di accesso coach/cliente;
- revisione legale e sanitaria dei testi.
