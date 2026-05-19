const fs = require("fs");
const path = require("path");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function loadExercises() {
  const file = path.join(process.cwd(), "data", "coachai-exercises.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function norm(value) {
  return String(value || "").trim().toLowerCase();
}

function includesAny(text, words) {
  const source = norm(text);
  return words.some((word) => source.includes(word));
}

function unique(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function goalProfile(goal = "") {
  const value = norm(goal);
  if (value.includes("ipertrofia")) {
    return {
      name: "Ipertrofia",
      priorities: ["Ipertrofia", "Forza in palestra", "Mobilita e core"],
      volume: "medio-alto",
      rirMain: "1-2",
      rirAccessory: "1-3",
      mainReps: "6-10",
      accessoryReps: "10-15",
    };
  }
  if (value.includes("forza")) {
    return {
      name: "Forza",
      priorities: ["Forza in palestra", "Prevenzione infortuni", "Mobilita e core"],
      volume: "medio",
      rirMain: "2",
      rirAccessory: "2-3",
      mainReps: "4-6",
      accessoryReps: "8-12",
    };
  }
  if (value.includes("performance")) {
    return {
      name: "Performance sportiva",
      priorities: ["Forza in palestra", "Prevenzione infortuni", "Corsa performance", "HIIT", "Mobilita e core"],
      volume: "medio",
      rirMain: "2-3",
      rirAccessory: "2-3",
      mainReps: "5-8",
      accessoryReps: "8-12",
    };
  }
  if (value.includes("dimagrimento") || value.includes("ricomposizione")) {
    return {
      name: "Ricomposizione",
      priorities: ["Forza in palestra", "Dimagrimento/metabolico", "HIIT", "Corsa base", "Mobilita e core"],
      volume: "medio",
      rirMain: "2",
      rirAccessory: "2-3",
      mainReps: "8-12",
      accessoryReps: "10-15",
    };
  }
  if (value.includes("ritorno")) {
    return {
      name: "Ritorno graduale",
      priorities: ["Mobilita e core", "Prevenzione infortuni", "Forza in palestra", "Corsa base"],
      volume: "basso-medio",
      rirMain: "3",
      rirAccessory: "3",
      mainReps: "8-10",
      accessoryReps: "10-12",
    };
  }
  return {
    name: "Benessere",
    priorities: ["Forza in palestra", "Mobilita e core", "Corsa base", "Prevenzione infortuni"],
    volume: "medio",
    rirMain: "2-3",
    rirAccessory: "2-3",
    mainReps: "6-10",
    accessoryReps: "10-15",
  };
}

function sportProfile(sports = []) {
  const text = sports.map(norm).join(" ");
  if (includesAny(text, ["tennis", "padel"])) {
    return {
      name: "sport di racchetta",
      needs: ["rotazione controllata", "spalla/scapola", "anca", "cambi direzione", "core antirotazione"],
      preferredPatterns: ["squat/lunge", "spinta", "tirata", "core", "mobilita"],
      conditioning: "Corsa performance",
    };
  }
  if (includesAny(text, ["calcio", "basket", "pallavolo", "rugby"])) {
    return {
      name: "sport di campo",
      needs: ["accelerazione", "frenata", "salto", "anca-ginocchio-caviglia", "core"],
      preferredPatterns: ["squat/lunge", "hinge", "spinta", "tirata", "core"],
      conditioning: "Corsa performance",
    };
  }
  if (includesAny(text, ["nuoto"])) {
    return {
      name: "nuoto",
      needs: ["spalla/scapola", "core", "mobilita toracica", "resistenza"],
      preferredPatterns: ["tirata", "spinta", "core", "mobilita", "hinge"],
      conditioning: "Nuoto",
    };
  }
  if (includesAny(text, ["running"])) {
    return {
      name: "running",
      needs: ["piede-caviglia", "anca", "core", "catena posteriore"],
      preferredPatterns: ["hinge", "squat/lunge", "core", "mobilita"],
      conditioning: "Corsa base",
    };
  }
  if (includesAny(text, ["ciclismo", "bike"])) {
    return {
      name: "ciclismo",
      needs: ["quadricipiti", "glutei", "core", "mobilita anca"],
      preferredPatterns: ["squat/lunge", "hinge", "core", "mobilita"],
      conditioning: "Bici",
    };
  }
  return {
    name: "fitness generale",
    needs: ["forza generale", "core", "mobilita", "capacita aerobica"],
    preferredPatterns: ["squat/lunge", "hinge", "spinta", "tirata", "core", "mobilita"],
    conditioning: "Dimagrimento/metabolico",
  };
}

function splitForDays(days, profile, sport, requestedTypes) {
  const types = requestedTypes && requestedTypes.length ? requestedTypes : profile.priorities;
  const templates = {
    1: [["Full body tecnico", ["squat/lunge", "hinge", "spinta", "tirata", "core"]]],
    2: [
      ["Forza full body A", ["squat/lunge", "spinta", "tirata", "core"]],
      ["Forza full body B", ["hinge", "tirata", "spinta", "mobilita"]],
    ],
    3: [
      ["Lower + core", ["squat/lunge", "hinge", "core", "mobilita"]],
      ["Upper + postura", ["spinta", "tirata", "spinta", "tirata", "core"]],
      ["Performance + conditioning", ["squat/lunge", "hinge", "core", "cardio"]],
    ],
    4: [
      ["Lower forza", ["squat/lunge", "hinge", "core"]],
      ["Upper forza", ["spinta", "tirata", "spinta", "tirata"]],
      ["Lower volume/prevenzione", ["squat/lunge", "hinge", "mobilita", "core"]],
      ["Conditioning + core", ["cardio", "core", "mobilita"]],
    ],
    5: [
      ["Lower forza", ["squat/lunge", "hinge", "core"]],
      ["Upper forza", ["spinta", "tirata", "spinta"]],
      ["Aerobico/conditioning", ["cardio", "core", "mobilita"]],
      ["Lower volume", ["squat/lunge", "hinge", "core"]],
      ["Upper volume + mobilita", ["tirata", "spinta", "core", "mobilita"]],
    ],
    6: [
      ["Lower forza", ["squat/lunge", "hinge", "core"]],
      ["Upper forza", ["spinta", "tirata", "spinta"]],
      ["Conditioning", ["cardio", "core"]],
      ["Lower volume", ["squat/lunge", "hinge", "mobilita"]],
      ["Upper volume", ["tirata", "spinta", "core"]],
      ["Mobilita + prevenzione", ["mobilita", "core", "squat/lunge"]],
    ],
  };
  const base = templates[Math.max(1, Math.min(6, days))];
  return base.map((item, index) => ({
    name: item[0],
    patterns: item[1],
    type: types[index % types.length],
    sportNeed: sport.needs[index % sport.needs.length],
  }));
}

function scoreExercise(ex, context) {
  let score = 0;
  const category = ex.category || "";
  const pattern = ex.movementPattern || "";
  const selectedTypes = context.trainingTypes || [];
  const equipment = context.equipment || [];
  const limitations = norm(context.limitations);
  const goal = norm(context.goal);

  if (selectedTypes.includes(category)) score += 8;
  if (context.profile.priorities.includes(category)) score += 5;
  if (context.dayType === category) score += 4;
  if (context.pattern === pattern) score += 7;
  if (context.sport.preferredPatterns.includes(pattern)) score += 3;
  if (!equipment.length || ex.equipment?.some((item) => equipment.includes(item))) score += 5;
  if (ex.equipment?.includes("Corpo libero")) score += 1;
  if (ex.level?.includes(context.level)) score += 2;
  if (context.level !== "Avanzato" && ex.level?.includes("Avanzato")) score -= 8;
  if (goal.includes("forza") && category === "Forza in palestra") score += 3;
  if (goal.includes("ipertrofia") && (category === "Ipertrofia" || category === "Forza in palestra")) score += 3;
  if (goal.includes("dimagrimento") && ["Dimagrimento/metabolico", "HIIT", "Corsa base"].includes(category)) score += 3;

  const name = norm(ex.name);
  if (limitations.includes("spalla") && includesAny(name, ["press", "shoulder", "upright", "jerk", "snatch"])) score -= 7;
  if (limitations.includes("schiena") && includesAny(name, ["deadlift", "good morning", "stiff", "yoke"])) score -= 7;
  if (limitations.includes("ginocchio") && includesAny(name, ["jump", "squat", "lunge", "bound"])) score -= 5;
  return score;
}

function chooseExercise(candidates, usedNames, context) {
  const ranked = candidates
    .filter((ex) => !usedNames.has(ex.name))
    .map((ex) => ({ ex, score: scoreExercise(ex, context) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.ex || candidates.find((ex) => !usedNames.has(ex.name)) || candidates[0];
}

function prescription(ex, slot, profile, minutes) {
  const isMain = slot === "main";
  const isWarmup = slot === "warmup";
  const isMobility = ex.category === "Mobilita e core" || slot === "cooldown";
  const isConditioning = ["Corsa base", "Corsa performance", "Bici", "Nuoto", "HIIT", "Dimagrimento/metabolico"].includes(ex.category);

  if (isWarmup) return { sets: "2", reps: "6-8 controllate", rest: 30, rir: "4", tut: "lento" };
  if (isMobility) return { sets: "2-3", reps: "30-45 sec", rest: 30, rir: "3-4", tut: "lento" };
  if (isConditioning) {
    const duration = minutes >= 60 ? "18-30 min" : "10-18 min";
    return { sets: ex.sets || "1", reps: ex.reps || duration, rest: Number(ex.restSeconds || 60), rir: "2-3", tut: ex.tut || "ritmo controllato" };
  }
  if (isMain) return { sets: "4", reps: profile.mainReps, rest: Number(ex.restSeconds || 105), rir: profile.rirMain, tut: ex.tut || "3-1-1" };
  return { sets: ex.sets || "3", reps: profile.accessoryReps, rest: Math.min(Number(ex.restSeconds || 90), 90), rir: profile.rirAccessory, tut: ex.tut || "2-1-2" };
}

function buildDescription(ex, slot, context) {
  const base = ex.description || "Esegui il movimento in modo controllato, senza dolore e con respirazione regolare.";
  const intent = {
    warmup: "Scopo: preparare articolazioni, temperatura e controllo motorio prima dei blocchi principali.",
    main: `Scopo: stimolo principale per ${context.profile.name.toLowerCase()}, mantenendo tecnica stabile e margine di sicurezza.`,
    accessory: `Scopo: completare il lavoro sul pattern ${context.pattern || "motorio"} senza creare fatica inutile.`,
    conditioning: `Scopo: condizionamento coerente con ${context.sport.name}, senza perdere qualita tecnica.`,
    cooldown: "Scopo: chiudere la seduta riducendo tensione e migliorando mobilita utile.",
  }[slot] || "Scopo: lavoro tecnico controllato.";
  return `${intent} ${base}`.slice(0, 900);
}

function normalizeExercise(ex, slot, context) {
  const rx = prescription(ex, slot, context.profile, context.minutes);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: ex.name,
    type: slot === "warmup" ? "Riscaldamento" : slot === "cooldown" ? "Defaticamento/mobilita" : ex.category,
    description: buildDescription(ex, slot, context),
    commonErrors: ex.commonErrors || "Evita compensi, fretta, carichi non controllati e qualsiasi range doloroso.",
    sets: rx.sets,
    reps: rx.reps,
    rest: rx.rest,
    rir: rx.rir,
    tut: rx.tut,
    load: "",
    notes: [
      `Pattern: ${ex.movementPattern || "generale"}`,
      ex.primaryMuscles?.length ? `Muscoli principali: ${ex.primaryMuscles.join(", ")}` : "",
      context.daySportNeed ? `Focus sportivo: ${context.daySportNeed}` : "",
      ex.images?.[0] ? `Immagine riferimento: ${ex.images[0]}` : "",
    ].filter(Boolean).join(" | "),
    completed: false,
  };
}

function buildDayExercises(exercises, day, context, usedNames) {
  const blocks = [];
  const all = exercises.length ? exercises : loadExercises();
  const mobility = all.filter((ex) => ex.category === "Mobilita e core");
  const conditioning = all.filter((ex) => ex.category === day.type || ex.category === context.sport.conditioning || ["HIIT", "Corsa base", "Corsa performance", "Bici", "Nuoto", "Dimagrimento/metabolico"].includes(ex.category));

  const warmup = chooseExercise(mobility, usedNames, { ...context, pattern: "mobilita", dayType: "Mobilita e core" });
  if (warmup) {
    usedNames.add(warmup.name);
    blocks.push(normalizeExercise(warmup, "warmup", { ...context, pattern: "mobilita", daySportNeed: day.sportNeed }));
  }

  const targetCount = context.minutes >= 75 ? 8 : context.minutes >= 55 ? 7 : context.minutes >= 40 ? 6 : 5;
  day.patterns.forEach((pattern, index) => {
    if (blocks.length >= targetCount - 1) return;
    const pool = pattern === "cardio" ? conditioning : all.filter((ex) => ex.movementPattern === pattern || (pattern === "mobilita" && ex.category === "Mobilita e core"));
    const slot = pattern === "cardio" ? "conditioning" : index === 0 ? "main" : "accessory";
    const selected = chooseExercise(pool.length ? pool : all, usedNames, { ...context, pattern, dayType: day.type });
    if (!selected) return;
    usedNames.add(selected.name);
    blocks.push(normalizeExercise(selected, slot, { ...context, pattern, daySportNeed: day.sportNeed }));
  });

  while (blocks.length < targetCount - 1) {
    const selected = chooseExercise(all, usedNames, { ...context, pattern: "", dayType: day.type });
    if (!selected) break;
    usedNames.add(selected.name);
    blocks.push(normalizeExercise(selected, "accessory", { ...context, pattern: selected.movementPattern, daySportNeed: day.sportNeed }));
  }

  const cooldown = chooseExercise(mobility, usedNames, { ...context, pattern: "mobilita", dayType: "Mobilita e core" });
  if (cooldown && blocks.length < targetCount) {
    usedNames.add(cooldown.name);
    blocks.push(normalizeExercise(cooldown, "cooldown", { ...context, pattern: "mobilita", daySportNeed: day.sportNeed }));
  }
  return blocks;
}

function buildProgram(payload = {}) {
  const anamnesis = payload.anamnesis || {};
  const focus = payload.focus || "";
  const db = payload.exerciseDatabase && payload.exerciseDatabase.length ? payload.exerciseDatabase : loadExercises();
  const days = Math.max(1, Math.min(6, Number(anamnesis.days || 3)));
  const minutes = Math.max(20, Math.min(150, Number(anamnesis.minutes || 60)));
  const profile = goalProfile(anamnesis.goal);
  const sport = sportProfile(anamnesis.sports || []);
  const split = splitForDays(days, profile, sport, anamnesis.trainingTypes || []);
  const usedNames = new Set();
  const context = {
    goal: anamnesis.goal || "",
    trainingTypes: anamnesis.trainingTypes || [],
    equipment: anamnesis.equipment || [],
    limitations: anamnesis.limitations || "",
    level: anamnesis.level || "Intermedio",
    profile,
    sport,
    minutes,
  };

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: `CoachAI - ${profile.name} - ${(anamnesis.sports || []).join(", ") || "fitness generale"}`,
    createdAt: new Date().toISOString(),
    disclaimer: "Scheda informativa. In caso di dolore, patologie o sintomi interrompi e consulta un medico o Andrea.",
    summary: [
      `${days} sedute da circa ${minutes} minuti.`,
      `Logica: ${profile.name}, volume ${profile.volume}, focus ${sport.name}.`,
      focus ? `Richiesta specifica: ${focus}.` : "",
      sport.needs.length ? `Priorita sportive: ${sport.needs.join(", ")}.` : "",
    ].filter(Boolean).join(" "),
    programmingNotes: {
      split: split.map((day) => day.name),
      progression: "Quando completi tutte le serie con tecnica pulita e RIR uguale o superiore al target, aumenta il carico del 2-5% o aggiungi 1-2 ripetizioni. Se dolore o tecnica sporca, riduci carico/volume.",
      safety: "Evita esercizi che riproducono dolore dichiarato. Mantieni 1-3 ripetizioni in riserva nella maggior parte dei lavori.",
    },
    days: split.map((day, index) => ({
      name: `Allenamento ${index + 1} - ${day.name}`,
      focus: `${day.type} | ${day.sportNeed}`,
      sessionFeedback: "",
      aiSuggestion: "",
      exercises: buildDayExercises(db, day, context, usedNames),
    })),
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Metodo non consentito" });
  try {
    const body = req.body && typeof req.body === "object" ? req.body : await readBody(req);
    return json(res, 200, { plan: buildProgram(body.payload || body) });
  } catch (error) {
    return json(res, 500, { error: error.message || "Errore programmazione scheda" });
  }
};

module.exports.buildProgram = buildProgram;
