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

function curatedExercises() {
  const base = [
    ["Goblet squat con pausa", "Forza in palestra", "squat/lunge", ["Manubri", "Kettlebell"], ["quadriceps", "glutes"], "Scendi in controllo, fermati un secondo in basso e risali mantenendo ginocchia allineate e tronco stabile.", "Ginocchia che collassano, schiena arrotondata, rimbalzo in basso.", "4", "6-8", 120, "2", "3-1-1"],
    ["Split squat con manubri", "Forza in palestra", "squat/lunge", ["Manubri", "Corpo libero"], ["quadriceps", "glutes"], "Mantieni passo stabile, busto leggermente inclinato e spinta dal piede davanti. Ottimo per sport di campo e racchetta.", "Passo troppo corto, ginocchio instabile, spinta solo sulla punta.", "3-4", "8-10 per lato", 90, "2", "3-1-1"],
    ["Romanian deadlift con manubri", "Forza in palestra", "hinge", ["Manubri", "Bilanciere"], ["hamstrings", "glutes"], "Porta le anche indietro, mantieni schiena neutra e senti tensione sui femorali. Il carico resta vicino alle gambe.", "Piegare troppo le ginocchia, arrotondare la schiena, allontanare i pesi.", "4", "8-10", 120, "2", "3-1-1"],
    ["Hip thrust con fermo", "Ipertrofia", "hinge", ["Bilanciere", "Manubri"], ["glutes"], "Chiudi in alto con bacino stabile e fermo di un secondo. Cerca glutei, non zona lombare.", "Iperestendere la schiena, piedi troppo avanti, rimbalzare.", "4", "8-12", 105, "1-2", "2-1-2"],
    ["Rematore manubrio con fermo", "Forza in palestra", "tirata", ["Manubri"], ["lats", "middle back"], "Tira il gomito verso il fianco, petto aperto e fermo breve in chiusura. Movimento controllato.", "Ruotare il busto, tirare col trapezio, perdere controllo in discesa.", "4", "8-12 per lato", 90, "2", "2-1-2"],
    ["Rematore elastico in mezzo squat", "Prevenzione infortuni", "tirata", ["Elastici"], ["middle back", "rear shoulders"], "Mantieni mezzo squat stabile e tira l'elastico portando i gomiti indietro. Utile per postura e controllo scapolare.", "Spalle alte, busto che oscilla, elastico troppo duro.", "3", "12-15", 50, "3", "2-1-2"],
    ["Rematore petto supportato", "Forza in palestra", "tirata", ["Manubri", "Panca"], ["middle back", "lats"], "Appoggia il petto su panca inclinata e tira senza slanci. Variante pulita per allenare la schiena riducendo compensi lombari.", "Staccare il petto, tirare col collo, perdere controllo in discesa.", "4", "8-12", 90, "2", "2-1-2"],
    ["Lat machine presa neutra", "Forza in palestra", "tirata", ["Macchine palestra", "Cavi"], ["lats"], "Porta i gomiti verso le tasche e mantieni torace alto. Risali controllando le scapole.", "Tirare dietro il collo, slanciare il busto, chiudere le spalle.", "4", "8-10", 105, "2", "2-1-2"],
    ["Push-up inclinato", "Forza in palestra", "spinta", ["Corpo libero"], ["chest", "triceps"], "Mani su rialzo, corpo in linea e scapole controllate. Scegli altezza che permette tecnica pulita.", "Bacino che cade, gomiti troppo larghi, collo teso.", "3-4", "8-12", 75, "2", "2-1-1"],
    ["Floor press con manubri", "Forza in palestra", "spinta", ["Manubri"], ["chest", "triceps"], "Sdraiato a terra, gomiti controllati e spinta verticale. Variante stabile se la spalla è sensibile.", "Perdere controllo scapole, rimbalzare coi gomiti, carico eccessivo.", "4", "6-10", 105, "2", "2-1-1"],
    ["Landmine press mezzo inginocchio", "Forza in palestra", "spinta", ["Bilanciere"], ["shoulders", "triceps"], "Spinta diagonale controllata con tronco stabile. Piu tollerabile della spinta verticale in molti casi.", "Inarcare la schiena, spalla che sale, spingere troppo pesante.", "3-4", "8-10 per lato", 90, "2-3", "2-1-1"],
    ["Face pull elastico", "Prevenzione infortuni", "tirata", ["Elastici", "Cavi"], ["rear shoulders", "traps"], "Tira verso il viso con gomiti alti e scapole che ruotano bene. Utile per postura e spalla.", "Inarcare la schiena, tirare solo con braccia, elastico troppo duro.", "3", "12-15", 45, "3", "2-1-2"],
    ["Extrarotazione elastico", "Prevenzione infortuni", "tirata", ["Elastici"], ["shoulders"], "Gomito vicino al fianco, scapola stabile, rotazione lenta e precisa.", "Gomito che si allontana, polso piegato, compenso col busto.", "3", "12-15 per lato", 45, "3", "2-1-2"],
    ["Pallof press", "Prevenzione infortuni", "core", ["Elastici", "Cavi"], ["abdominals"], "Spingi avanti resistendo alla rotazione. Bacino fermo e respiro controllato.", "Ruotare il busto, spalle alte, carico troppo forte.", "3", "8-12 per lato", 45, "3", "2-1-2"],
    ["Dead bug respirato", "Mobilita e core", "core", ["Corpo libero"], ["abdominals"], "Costole giù, schiena stabile, espira mentre distendi braccio e gamba opposti.", "Inarcare la schiena, muoversi veloce, trattenere il respiro.", "3", "6-8 per lato", 40, "3", "lento"],
    ["Bird dog con fermo", "Mobilita e core", "core", ["Corpo libero"], ["abdominals", "glutes"], "Allunga braccio e gamba opposti senza ruotare il bacino, fermo di due secondi e ritorno lento.", "Ruotare il bacino, alzare troppo la gamba, perdere controllo del collo.", "3", "6-8 per lato", 35, "3", "lento"],
    ["Side plank", "Mobilita e core", "core", ["Corpo libero"], ["obliques"], "Bacino alto, spalla stabile e corpo in linea. Mantieni respirazione regolare.", "Bacino basso, collo contratto, spalla compressa.", "3", "20-35 sec per lato", 45, "3", "isometrico"],
    ["Farmer carry", "Forza in palestra", "core", ["Manubri", "Kettlebell"], ["abdominals", "traps"], "Cammina con carichi ai lati, postura alta e passo controllato. Ottimo per core, presa e stabilità generale.", "Spalle collassate, busto inclinato, passi disordinati, carico eccessivo.", "4", "20-30 m", 75, "2-3", "controllato"],
    ["Step down controllato", "Prevenzione infortuni", "squat/lunge", ["Corpo libero", "Panca"], ["quadriceps", "glutes"], "Scendi lentamente da un rialzo basso controllando ginocchio, anca e piede.", "Ginocchio che cade dentro, rialzo troppo alto, discesa veloce.", "3", "6-8 per lato", 75, "3", "3-1-1"],
    ["Camminata inclinata", "Dimagrimento/metabolico", "cardio", ["Tapis roulant"], ["quadriceps", "glutes"], "Ritmo sostenibile, postura alta e respirazione controllata. Ottima per lavoro aerobico a basso impatto.", "Aggrapparsi al tapis, pendenza eccessiva, passo troppo lungo.", "1", "20-35 min", 45, "3", "Z2-Z3"],
    ["Corsa facile con allunghi", "Corsa base", "cardio", ["Corpo libero", "Tapis roulant"], ["calves", "quadriceps"], "Ritmo conversazionale, poi 4-6 allunghi brevi con recupero camminando.", "Partire forte, trasformare gli allunghi in sprint, appoggi rumorosi.", "1", "30-45 min", 60, "3", "Z2"],
    ["Cambi direzione controllati", "Corsa performance", "cardio", ["Corpo libero"], ["quadriceps", "glutes"], "Accelerazione breve, frenata controllata e ripartenza. Qualità prima del volume.", "Frenare rigido, ginocchio in valgo, recupero insufficiente.", "6-8", "5-8 sec", 75, "3", "esplosivo pulito"],
    ["Bike intervalli moderati", "Bici", "cardio", ["Bike"], ["quadriceps"], "Blocchi a intensità medio-alta ma ripetibile, cadenza regolare e postura stabile.", "Rapporto troppo duro, bacino instabile, partire troppo forte.", "4", "3 min medio / 2 min facile", 90, "2-3", "85-95 rpm"],
    ["HIIT bike basso impatto", "HIIT", "cardio", ["Bike"], ["quadriceps"], "Intervalli brevi intensi su bike, recupero sufficiente per mantenere qualità.", "Sprint troppo lunghi, recupero corto, postura disordinata.", "8", "20 sec forte / 70 sec facile", 70, "2-3", "potente"],
    ["Mobilita anca 90/90", "Mobilita e core", "mobilita", ["Corpo libero"], ["glutes", "adductors"], "Transizioni lente tra posizioni 90/90, busto alto e controllo del respiro.", "Forzare il ginocchio, crollare col busto, usare slancio.", "2-3", "6 transizioni lente", 35, "4", "lento"],
    ["World greatest stretch controllato", "Mobilita e core", "mobilita", ["Corpo libero"], ["hips", "thoracic"], "Affondo lungo, gomito verso il piede e rotazione toracica lenta. Prepara anche, colonna toracica e catena posteriore.", "Forzare la schiena, perdere appoggio del piede, muoversi troppo veloce.", "2", "4-5 per lato", 30, "4", "lento"],
    ["Mobilita caviglia al muro", "Mobilita e core", "mobilita", ["Corpo libero"], ["calves"], "Porta il ginocchio verso il muro senza sollevare il tallone. Utile per squat, corsa e cambi direzione.", "Tallone che si alza, arco plantare che collassa, dolore anteriore.", "2-3", "8-10 per lato", 25, "4", "lento"],
  ];
  return base.map((item, index) => ({
    id: `curated-${index}`,
    name: item[0],
    source: "coachai-curated",
    category: item[1],
    movementPattern: item[2],
    equipment: item[3],
    level: ["Principiante", "Intermedio", "Avanzato"],
    primaryMuscles: item[4],
    secondaryMuscles: [],
    goal: ["forza", "ipertrofia", "performance sportiva", "dimagrimento", "benessere"],
    description: item[5],
    commonErrors: item[6],
    sets: item[7],
    reps: item[8],
    restSeconds: item[9],
    rir: item[10],
    tut: item[11],
    images: [],
  }));
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

function isLowQualityExercise(ex, context = {}) {
  const name = norm(ex.name);
  const level = context.level || "Intermedio";
  const banned = [
    "yoke", "atlas", "tire", "log lift", "sled", "strongman",
    "snatch", "jerk", "clean and jerk", "muscle-up", "muscle up",
    "handstand", "neck", "behind the neck", "partner", "assisted inverse",
    "smith machine behind", "one-arm kettlebell snatch", "plyo push-up",
    "wide-grip rear pull-up", "gorilla", "decline crunch", "clock push-up",
    "close-grip push-up off",
  ];
  if (banned.some((word) => name.includes(word)) && level !== "Avanzato") return true;
  if (name.includes("jump") && norm(context.limitations).includes("ginocchio")) return true;
  if ((name.includes("press") || name.includes("shoulder") || name.includes("push-up") || name.includes("push up")) && norm(context.limitations).includes("spalla") && !name.includes("inclinato")) return true;
  return false;
}

function commonExerciseBoost(ex) {
  const name = norm(ex.name);
  const preferred = [
    "squat", "lunge", "split squat", "step", "leg press", "hip thrust", "glute bridge",
    "deadlift", "romanian", "row", "pulldown", "pull-up", "push-up", "chest press",
    "floor press", "plank", "dead bug", "side plank", "pallof", "face pull",
    "external rotation", "calf raise", "hamstring curl", "bike", "elliptical",
    "run", "stretch", "mobility",
  ];
  const weird = ["gorilla", "body-up", "sissy", "circus", "around the worlds", "wind sprints"];
  let score = 0;
  if (preferred.some((word) => name.includes(word))) score += 6;
  if (weird.some((word) => name.includes(word))) score -= 8;
  return score;
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
  if (ex.source === "coachai-curated") score += 30;
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
  score += commonExerciseBoost(ex);

  const name = norm(ex.name);
  if (limitations.includes("spalla") && includesAny(name, ["press", "shoulder", "upright", "jerk", "snatch"])) score -= 7;
  if (limitations.includes("schiena") && includesAny(name, ["deadlift", "good morning", "stiff", "yoke"])) score -= 7;
  if (limitations.includes("ginocchio") && includesAny(name, ["jump", "squat", "lunge", "bound"])) score -= 5;
  return score;
}

function chooseExercise(candidates, usedNames, context) {
  const filtered = candidates.filter((ex) => !isLowQualityExercise(ex, context));
  const source = filtered.length ? filtered : candidates;
  const ranked = source
    .filter((ex) => !usedNames.has(ex.name))
    .map((ex) => ({ ex, score: scoreExercise(ex, context) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.ex || source.find((ex) => !usedNames.has(ex.name)) || source[0];
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
  const raw = exercises.length ? exercises : loadExercises();
  const all = raw.filter((ex) => !isLowQualityExercise(ex, context));
  const source = all.length ? all : raw;
  const mobility = source.filter((ex) => ex.category === "Mobilita e core");
  const conditioning = source.filter((ex) => ex.category === day.type || ex.category === context.sport.conditioning || ["HIIT", "Corsa base", "Corsa performance", "Bici", "Nuoto", "Dimagrimento/metabolico"].includes(ex.category));

  const warmup = chooseExercise(mobility, usedNames, { ...context, pattern: "mobilita", dayType: "Mobilita e core" });
  if (warmup) {
    usedNames.add(warmup.name);
    blocks.push(normalizeExercise(warmup, "warmup", { ...context, pattern: "mobilita", daySportNeed: day.sportNeed }));
  }

  const targetCount = context.minutes >= 75 ? 8 : context.minutes >= 55 ? 7 : context.minutes >= 40 ? 6 : 5;
  day.patterns.forEach((pattern, index) => {
    if (blocks.length >= targetCount - 1) return;
    const pool = pattern === "cardio" ? conditioning : source.filter((ex) => ex.movementPattern === pattern || (pattern === "mobilita" && ex.category === "Mobilita e core"));
    const slot = pattern === "cardio" ? "conditioning" : index === 0 ? "main" : "accessory";
    const selected = chooseExercise(pool.length ? pool : source, usedNames, { ...context, pattern, dayType: day.type });
    if (!selected) return;
    usedNames.add(selected.name);
    blocks.push(normalizeExercise(selected, slot, { ...context, pattern, daySportNeed: day.sportNeed }));
  });

  while (blocks.length < targetCount - 1) {
    const selected = chooseExercise(source, usedNames, { ...context, pattern: "", dayType: day.type });
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
  const externalDb = payload.exerciseDatabase && payload.exerciseDatabase.length ? payload.exerciseDatabase : loadExercises();
  const db = unique([...curatedExercises(), ...externalDb], (ex) => ex.id || ex.name);
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
