// ============================================================
//  CoachAI · Andrea Bertelli — Funzione serverless Andrea IA
//  Vercel Serverless Function  (Node.js runtime)
//
//  RUOLO DELL'AI (vincolato):
//   - SPIEGARE gli esercizi e i concetti
//   - ADATTARE carichi, ripetizioni e alternative
//   - SUGGERIRE e RISPONDERE ai dubbi
//   NON deve costruire schede complete da zero: la logica
//   delle schede è template-based e vive nel frontend.
//
//  Variabile d'ambiente richiesta su Vercel:
//   ANTHROPIC_API_KEY
// ============================================================

// Modello AI usato da Andrea IA. Se dovesse dare errore di modello,
// prova un'altra stringa (es. 'claude-haiku-4-5-20251001').
const AI_MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Sei "Andrea IA", l'assistente virtuale dell'app di allenamento CoachAI creata dal personal trainer Andrea Bertelli.

IL TUO RUOLO (rigido):
- SPIEGARE come si eseguono gli esercizi, la tecnica, gli errori comuni.
- ADATTARE su richiesta dell'utente: suggerire come modulare carichi, ripetizioni, recuperi o proporre alternative a un esercizio (es. se manca un attrezzo).
- SUGGERIRE consigli pratici su esecuzione, recupero, costanza, riscaldamento e mobilità generale.
- RISPONDERE ai dubbi sull'allenamento in modo chiaro e motivante.

COSA NON DEVI FARE:
- NON costruire o riscrivere una scheda di allenamento completa da zero. Le schede sono generate dall'app con un metodo predefinito. Se l'utente chiede "creami una scheda nuova", spiega gentilmente che le schede si generano dal Catalogo dell'app scegliendo l'obiettivo, e che tu lo aiuti a seguirle e adattarle.
- NON dare diagnosi mediche, prescrizioni o piani alimentari dettagliati. Per l'alimentazione rimanda ad "AB Nutrition". Per problemi di salute, dolore, patologie, gravidanza o sintomi, invita SEMPRE a fermarsi e consultare un medico.
- NON inventare dati clinici.

STILE:
- Italiano, tono amichevole, professionale e diretto, come un bravo coach.
- Risposte brevi e concrete (max ~150 parole), con elenchi puntati quando utile.
- Quando la richiesta richiede personalizzazione vera (storia clinica, infortuni, obiettivi complessi), invita a richiedere una consulenza personalizzata con Andrea Bertelli.

Hai a disposizione il contesto dell'utente e della sua scheda corrente: usalo per risposte pertinenti.`;

module.exports = async function handler(req, res) {
  // CORS / metodo
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo non consentito' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurata su Vercel.' });
    return;
  }

  try {
    // body parsing (Vercel di solito lo fa già; gestiamo entrambi i casi)
    let body = req.body;
    if (typeof body === 'string') { body = JSON.parse(body || '{}'); }
    body = body || {};

    const message = (body.message || '').toString().slice(0, 2000);
    const context = (body.context || '').toString().slice(0, 1500);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    if (!message.trim()) {
      res.status(400).json({ error: 'Messaggio vuoto.' });
      return;
    }

    // Costruzione messaggi: storico + contesto + messaggio corrente
    const messages = [];
    for (const h of history) {
      if (h && (h.role === 'user' || h.role === 'assistant') && h.content) {
        messages.push({ role: h.role, content: String(h.content).slice(0, 1500) });
      }
    }
    const userContent = context
      ? `[Contesto utente: ${context}]\n\nDomanda: ${message}`
      : message;
    messages.push({ role: 'user', content: userContent });

    // Prova più modelli in ordine: se uno non è valido/disponibile, passa al successivo.
    const MODELS = [AI_MODEL, 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-5', 'claude-sonnet-4-20250514']
      .filter((m, i, a) => m && a.indexOf(m) === i);

    let lastErr = null;
    for (const model of MODELS) {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({ model, max_tokens: 600, system: SYSTEM_PROMPT, messages })
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        const reply = (data.content || [])
          .filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
          || 'Non ho una risposta in questo momento, riprova.';
        res.status(200).json({ reply, model });
        return;
      }

      // Errore: leggi il dettaglio
      let detail = {};
      try { detail = await apiRes.json(); } catch (e) {}
      const type = detail?.error?.type || '';
      const msg = detail?.error?.message || ('HTTP ' + apiRes.status);
      lastErr = { status: apiRes.status, type, msg };
      console.error('Anthropic API error:', model, apiRes.status, type, msg);

      // Chiave errata/credito: inutile provare altri modelli, ferma subito.
      if (apiRes.status === 401 || type === 'authentication_error') {
        res.status(401).json({ error: 'Chiave API non valida o non attiva.',
          reply: '⚠️ La chiave API risulta non valida o non attiva. Controlla ANTHROPIC_API_KEY su Vercel (chiave corretta, attiva e con credito), poi fai un nuovo Deploy.' });
        return;
      }
      if (apiRes.status === 400 && /credit|billing|balance/i.test(msg)) {
        res.status(402).json({ error: 'Credito insufficiente.',
          reply: '⚠️ Il tuo account Anthropic sembra senza credito. Aggiungi credito su console.anthropic.com e riprova.' });
        return;
      }
      // Modello non trovato/non valido → prova il prossimo della lista
      if (apiRes.status === 404 || /model/i.test(msg)) continue;
      // Altri errori → prova comunque il prossimo
    }

    // Nessun modello ha funzionato
    res.status(502).json({
      error: 'Nessun modello disponibile: ' + (lastErr ? (lastErr.type || lastErr.status) + ' — ' + lastErr.msg : 'errore sconosciuto'),
      reply: '⚠️ Non riesco a ottenere una risposta dai modelli AI (' + (lastErr ? lastErr.msg : 'errore') + '). Verifica la chiave su Vercel; se persiste, scrivi ad Andrea.'
    });
    return;
  } catch (err) {
    console.error('chat.js error:', err);
    res.status(500).json({ error: 'Errore interno: ' + err.message, reply: 'Si è verificato un problema temporaneo. Riprova tra poco.' });
  }
};
