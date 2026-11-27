const svgModules = import.meta.glob<string>("./assets/exercises/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

const artBySlug: Record<string, string> = {};
for (const [path, url] of Object.entries(svgModules)) {
  const filename = path.split("/").pop();
  if (!filename) continue;
  const slug = filename.replace(/\.svg$/i, "");
  artBySlug[slug] = url;
}

const exactPolishMap: Record<string, string> = {
  "wyciskanie sztangi na ławce poziomej": "bench-press",
  "przysiady ze sztangą na plecach": "back-squat",
  "martwy ciąg klasyczny": "deadlift",
  "podciąganie na drążku nachwytem": "pull-up",
  "wyciskanie żołnierskie": "overhead-press",
  "uginanie przedramion z hantlami": "bicep-curl",
  "wyciskanie francuskie": "skull-crusher",
  "wiosłowanie sztangą w opadzie": "barbell-row",
  "przysiad bułgarski": "bulgarian-split-squat",
  deska: "plank",
};

const keywordRules: Array<{ terms: string[]; slug: string }> = [
  { terms: ["bułgar"], slug: "bulgarian-split-squat" },
  { terms: ["przysiad", "przedni"], slug: "front-squat" },
  { terms: ["goblet"], slug: "goblet-squat" },
  { terms: ["przysiad"], slug: "back-squat" },
  { terms: ["rumuńsk", "martwy"], slug: "romanian-deadlift" },
  { terms: ["sumo", "martwy"], slug: "sumo-deadlift" },
  { terms: ["martwy ciąg"], slug: "deadlift" },
  { terms: ["francuski"], slug: "skull-crusher" },
  { terms: ["żołnierski"], slug: "overhead-press" },
  { terms: ["wyciskanie", "nad głow"], slug: "overhead-press" },
  { terms: ["wyciskanie", "skos", "gór"], slug: "incline-bench-press" },
  { terms: ["wyciskanie", "skos", "dół"], slug: "decline-bench-press" },
  { terms: ["wyciskanie", "hantl", "bark"], slug: "dumbbell-shoulder-press" },
  { terms: ["wyciskanie", "hantl"], slug: "dumbbell-bench-press" },
  { terms: ["wyciskanie", "ławk"], slug: "bench-press" },
  { terms: ["rozpiętk", "wyciąg"], slug: "cable-fly" },
  { terms: ["rozpiętk"], slug: "dumbbell-fly" },
  { terms: ["poręcz", "pompk"], slug: "dip" },
  { terms: ["dip"], slug: "dip" },
  { terms: ["pompk"], slug: "push-up" },
  { terms: ["podciąganie", "podchwyt"], slug: "chin-up" },
  { terms: ["podciąganie"], slug: "pull-up" },
  { terms: ["ściąganie", "drążk"], slug: "lat-pulldown" },
  { terms: ["wiosłowanie", "wyciąg"], slug: "seated-cable-row" },
  { terms: ["wiosłowanie", "hantl"], slug: "dumbbell-row" },
  { terms: ["wiosłowanie"], slug: "barbell-row" },
  { terms: ["wznosy", "bok"], slug: "lateral-raise" },
  { terms: ["wznosy", "przód"], slug: "front-raise" },
  { terms: ["face pull"], slug: "face-pull" },
  { terms: ["młotkow"], slug: "hammer-curl" },
  { terms: ["modlitewnik"], slug: "preacher-curl" },
  { terms: ["nadgarstk", "prostow"], slug: "wrist-extension" },
  { terms: ["nadgarstk"], slug: "wrist-curl" },
  { terms: ["uginanie", "sztang"], slug: "barbell-curl" },
  { terms: ["uginanie", "ramion"], slug: "bicep-curl" },
  { terms: ["uginanie", "przedramion"], slug: "bicep-curl" },
  { terms: ["prostowanie", "wyciąg"], slug: "triceps-pushdown" },
  { terms: ["wykrok"], slug: "walking-lunge" },
  { terms: ["suwnic"], slug: "leg-press" },
  { terms: ["wyprost", "nóg"], slug: "leg-extension" },
  { terms: ["uginanie", "nóg"], slug: "lying-leg-curl" },
  { terms: ["hip thrust"], slug: "hip-thrust" },
  { terms: ["wypychanie bioder"], slug: "hip-thrust" },
  { terms: ["mostek"], slug: "glute-bridge" },
  { terms: ["wspięcia", "siedząc"], slug: "seated-calf-raise" },
  { terms: ["wspięcia"], slug: "standing-calf-raise" },
  { terms: ["deska", "boczn"], slug: "side-plank" },
  { terms: ["deska"], slug: "plank" },
  { terms: ["plank"], slug: "plank" },
  { terms: ["unoszenie nóg"], slug: "hanging-leg-raise" },
  { terms: ["brzuszk"], slug: "crunch" },
  { terms: ["russian twist"], slug: "russian-twist" },
  { terms: ["kółk", "brzuch"], slug: "ab-wheel-rollout" },
  { terms: ["bieg"], slug: "running" },
  { terms: ["rower"], slug: "cycling" },
  { terms: ["skakank"], slug: "skipping" },
  { terms: ["pajacyk"], slug: "jumping-jack" },
  { terms: ["burpee"], slug: "burpee" },
  { terms: ["ergometr"], slug: "rowing" },
];

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getExerciseArt(name: string): string | undefined {
  const normalized = name.trim().toLocaleLowerCase("pl");
  if (!normalized) return undefined;

  const exactSlug = exactPolishMap[normalized];
  if (exactSlug && artBySlug[exactSlug]) {
    return artBySlug[exactSlug];
  }

  const directSlug = toSlug(name);
  if (directSlug && artBySlug[directSlug]) {
    return artBySlug[directSlug];
  }

  for (const rule of keywordRules) {
    if (rule.terms.every((term) => normalized.includes(term))) {
      if (artBySlug[rule.slug]) return artBySlug[rule.slug];
    }
  }

  return undefined;
}
