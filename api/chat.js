const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function safeText(value) {
  return String(value || "").slice(0, 12000);
}

function systemPrompt() {
  return `
Sei Andrea IA, assistente digitale del brand Andrea Bertelli: psicologo, nutrizionista e preparatore fisico.
Rispondi in italiano, con tono professionale, chiaro e pratico.
Rispondi anche se l'utente non ha ancora una scheda: puoi chiarire dubbi generali su allenamento, nutrizione, recupero, progressione, tecnica e abitudini.
Non fare diagnosi, non prescrivere terapie e non sostituire medico, psicologo, nutrizionista o coach dal vivo.
Quando emergono dolore, patologie, sintomi importanti, farmaci, gravidanza, disturbi alimentari o rischio clinico, invita a interrompere l'attivita' e rivolgersi a un medico o chiedere consulenza ad Andrea.
Inserisci quando utile il contatto: humanperformancelab.app@gmail.com.
Per le schede fitness: dai esercizi descritti bene, serie, ripetizioni, recuperi, RIR, TUT, note tecniche, errori comuni, progressione e adattamento allo sport dichiarato. Puoi includere palestra, corsa, bici, nuoto, HIIT e mobilita' quando coerenti con sport, obiettivi e materiale.
`.trim();
}

function userPrompt(task, payload) {
  if (task === "generate_plan") {
    return `
Crea una scheda fitness/palestra/cardio personalizzata in JSON valido.
Considera anamnesi, obiettivi, sport, tipi di allenamento richiesti, materiale disponibile, numero allenamenti, progressi e focus richiesto.
La scheda deve essere specifica e ben fatta: non usare nomi generici se puoi indicare variante, intensita', progressione o scopo.
Imposta tu i recuperi in secondi in base a obiettivo, livello, esercizio e tempo disponibile. L'utente non li inserisce manualmente.
Ogni seduta deve avere normalmente 6-8 blocchi tra riscaldamento, parte principale, complementari, core/mobilita' e defaticamento; usa meno blocchi solo se il tempo disponibile e' molto basso.
Evita di ripetere sempre gli stessi esercizi tra sedute. Varia pattern, attrezzi e stimoli mantenendo coerenza con obiettivi e sport.
Se nei dati e' presente "exerciseDatabase", usalo come catalogo prioritario da cui scegliere esercizi. Puoi adattare descrizioni, recuperi, RIR e TUT, ma non ripetere sempre gli stessi nomi.
Se nei dati e' presente "programDraft", trattalo come struttura tecnica principale: mantieni split, logica, progressione e scelta esercizi salvo correzioni motivate. Il tuo compito e' rifinire descrizioni, coerenza e sicurezza, non distruggere la programmazione.
Non includere markdown. Restituisci solo JSON con questa forma:
{
  "plan": {
    "title": "string",
    "summary": "string",
    "disclaimer": "string",
    "days": [
      {
        "name": "Allenamento 1",
        "focus": "string",
        "exercises": [
          {
            "name": "string",
            "type": "Forza in palestra | Ipertrofia | Dimagrimento/metabolico | Corsa base | Corsa performance | Bici | Nuoto | HIIT | Mobilita e core | Prevenzione infortuni",
            "description": "descrizione tecnica chiara",
            "commonErrors": "errori comuni",
            "sets": "3",
            "reps": "8-12",
            "rest": 90,
            "rir": "2",
            "tut": "3-1-1 oppure ritmo/zone per cardio",
            "load": "",
            "notes": "",
            "completed": false
          }
        ]
      }
    ]
  }
}
Dati:
${safeText(JSON.stringify(payload, null, 2))}
`.trim();
  }

  if (task === "swap_exercise") {
    return `
Proponi una singola alternativa per un esercizio da sostituire. Rispetta motivo, dolore/attrezzi e anamnesi.
Restituisci solo JSON valido:
{
  "exercise": {
    "name": "string",
    "type": "string",
    "description": "descrizione tecnica chiara",
    "commonErrors": "errori comuni",
    "sets": "3",
    "reps": "8-12",
    "rest": 90,
    "rir": "2",
    "tut": "3-1-1 oppure ritmo/zone per cardio",
    "load": "",
    "notes": "perche' e' una buona sostituzione",
    "completed": false
  }
}
Dati:
${safeText(JSON.stringify(payload, null, 2))}
`.trim();
  }

  if (task === "workout_feedback") {
    return `
Analizza il feedback di fine allenamento e proponi modifiche pratiche alla scheda.
Considera esercizi completati, carichi, RIR, TUT, dolore, fatica, sport e obiettivi.
Restituisci solo JSON valido:
{
  "suggestion": "testo breve e pratico con cosa modificare nella prossima seduta"
}
Dati:
${safeText(JSON.stringify(payload, null, 2))}
`.trim();
  }

  return `
Rispondi alla domanda dell'utente in italiano.
Mantieni risposta pratica e prudente. Se serve, ricorda il disclaimer sanitario e il contatto humanperformancelab.app@gmail.com.
Dati disponibili:
${safeText(JSON.stringify(payload, null, 2))}
`.trim();
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("JSON non valido dalla AI");
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Metodo non consentito" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(res, 500, { error: "ANTHROPIC_API_KEY mancante" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const task = body.task || "chat";
    const payload = body.payload || {};
    const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";

    const anthropicResponse = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: task === "chat" ? 1200 : 3600,
        temperature: task === "chat" ? 0.4 : 0.25,
        system: systemPrompt(),
        messages: [{ role: "user", content: userPrompt(task, payload) }],
      }),
    });

    const data = await anthropicResponse.json();
    if (!anthropicResponse.ok) {
      return json(res, anthropicResponse.status, { error: data.error?.message || "Errore Anthropic" });
    }

    const text = data.content?.map((part) => part.text || "").join("\n").trim() || "";
    if (task === "chat") return json(res, 200, { reply: text });
    return json(res, 200, extractJson(text));
  } catch (error) {
    return json(res, 500, { error: error.message || "Errore server" });
  }
};
