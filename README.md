# CoachAI · Andrea Bertelli 🏋️

Web app (PWA installabile) che genera **schede di allenamento personalizzate per obiettivo**. Logica schede **template-based**; **Andrea IA** spiega/adatta/suggerisce (non costruisce schede da zero). Login con account cloud, progressi, timer, promemoria.

---

## 📁 File

```
coachai/
├── index.html        → app completa (UI + motore schede + login + progressi)
├── api/chat.js        → funzione serverless "Andrea IA" (Vercel)
├── manifest.json + sw.js + icone   → PWA
├── vercel.json        → config + header sicurezza
├── .gitignore / .env.example
└── README.md
```

---

## 🔐 Chiave API (sicurezza) — leggere!

La chiave Anthropic **non va MAI scritta nei file pubblicati**. Nel codice non è presente: viene letta solo lato server da `process.env.ANTHROPIC_API_KEY`. Inseriscila **solo** nelle Environment Variables di Vercel. Se l'hai condivisa, **revocala e creane una nuova** su console.anthropic.com.

---

## 🚀 1) Pubblicare su Vercel

1. Account su [vercel.com](https://vercel.com).
2. Importa il repo GitHub (o carica la cartella).
3. **Settings → Environment Variables** → aggiungi `ANTHROPIC_API_KEY` = la tua chiave.
4. **Deploy.**

---

## 👤 2) Attivare il LOGIN e la memoria utente (Supabase, gratis)

Il login e la sincronizzazione dei dati richiedono un piccolo backend. Usiamo **Supabase** (piano gratuito).

1. Vai su [supabase.com](https://supabase.com) → **New project** (scegli una password DB, salvala).
2. Nel progetto apri **SQL Editor** e incolla ed esegui questo:

   ```sql
   create table if not exists public.user_data (
     id uuid primary key references auth.users(id) on delete cascade,
     data jsonb,
     updated_at timestamptz default now()
   );
   alter table public.user_data enable row level security;

   create policy "own_select" on public.user_data
     for select using (auth.uid() = id);
   create policy "own_insert" on public.user_data
     for insert with check (auth.uid() = id);
   create policy "own_update" on public.user_data
     for update using (auth.uid() = id);
   ```

3. **Authentication → Providers → Email**: lascia attivo Email.
   - Per far accedere gli utenti **subito** senza email di conferma: **Authentication → Settings** → disattiva *"Confirm email"*. (Consigliato per iniziare.)
4. **Project Settings → API**: copia **Project URL** e **anon public key**.
5. In `index.html` (sezione CONFIG in alto) incolla:

   ```js
   const SUPABASE_URL = 'https://xxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'la-tua-anon-public-key';
   ```

6. Salva, fai un nuovo deploy. Ora all'apertura compare la **schermata di login/registrazione** e i dati utente (profilo, schede, progressi) vengono salvati nel cloud e ritrovati su ogni dispositivo.

> Se lasci `SUPABASE_URL`/`SUPABASE_ANON_KEY` vuoti, l'app funziona in **modalità locale** (dati solo su quel dispositivo, senza login). La anon key è pubblica per natura: la sicurezza è garantita dalle policy RLS qui sopra.

---

## 🤖 Andrea IA non risponde? (checklist)

1. **Stai aprendo `index.html` col doppio click?** La chat NON può funzionare così: `/api/chat` esiste solo quando l'app gira su Vercel (o in locale con `vercel dev`). Pubblica l'app.
2. **Hai impostato `ANTHROPIC_API_KEY` su Vercel?** Senza, la chat dà errore. Dopo averla aggiunta, rifai il **Deploy**.
3. **Chiave valida e con credito?** Verifica su console.anthropic.com.
4. **Errore di modello?** In `api/chat.js` cambia `AI_MODEL` con un'altra stringa valida (es. `claude-haiku-4-5-20251001`).

### Test in locale
```bash
npm i -g vercel
vercel dev   # http://localhost:3000  → qui /api/chat funziona
```

---

## 🏋️ Attrezzatura: incide davvero

La scelta dell'attrezzatura **cambia gli esercizi generati**: "Palestra completa" usa bilanciere/macchine/cavi; "Casa + manubri" niente macchine; "Solo corpo libero" niente attrezzi. Lo scegli nel **Catalogo → Personalizza generazione** e la scheda lo dichiara in alto. (Es.: in palestra compare *Pulley basso/Hip thrust*; a corpo libero diventano *Trazioni/Affondi/Superman*.)

---

## ⚙️ Personalizzazioni rapide (CONFIG in `index.html`)

```js
const PREMIUM_FREE_UNTIL = '2026-09-30';
const CONSULT_EMAIL = 'humanperformancelab.app@gmail.com';
const STRIPE_LINK = '';   // per attivare i pagamenti Premium (più avanti)
```
- Esercizi → array `EX` · Parametri obiettivo → `GOALS` · Split → `SPLITS` · Modello AI → `AI_MODEL` in `api/chat.js`.

---

## ⚠️ Disclaimer
Contenuti educativi e generali, non sostituiscono medico, psicologo, nutrizionista, fisioterapista o coach dal vivo. In caso di dolore, patologie, gravidanza, sintomi o dubbi clinici consultare un medico.

© Andrea Bertelli — CoachAI
