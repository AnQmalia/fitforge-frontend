import { useEffect, useState, type FormEvent, type ReactNode } from "react";

const STORAGE_KEY = "fitforge-survey";
const PLAN_STORAGE_KEY = "fitforge-generated-plan";

const GENDERS = ["Kobieta", "Mężczyzna", "Inna"] as const;
const EXPERIENCE_LEVELS = [
  "Początkujący",
  "Średniozaawansowany",
  "Zaawansowany",
] as const;
const GOALS = [
  "Schudnąć",
  "Zbudować masę mięśniową",
  "Zwiększyć siłę",
  "Poprawić kondycję",
  "Utrzymać formę",
] as const;
const EQUIPMENT_OPTIONS = [
  "Pełna siłownia",
  "Hantle i ławka",
  "Sztanga i hantle",
  "Drążek i mata",
  "Brak sprzętu (w domu)",
] as const;

interface Survey {
  age: string;
  gender: string;
  weight: string;
  height: string;
  experience: string;
  goal: string;
  equipment: string;
}

interface GeneratedPlan {
  planContent: string;
  source?: "openai" | "local";
}

const emptySurvey: Survey = {
  age: "",
  gender: "",
  weight: "",
  height: "",
  experience: "",
  goal: "",
  equipment: "",
};

function loadSurvey(): Survey | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Survey>;
    return { ...emptySurvey, ...parsed };
  } catch {
    return null;
  }
}

function loadGeneratedPlan(): GeneratedPlan | null {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GeneratedPlan>;
    if (!parsed.planContent) return null;
    return {
      planContent: parsed.planContent,
      source: parsed.source,
    };
  } catch {
    return null;
  }
}

export default function GeneratorTab() {
  const [survey, setSurvey] = useState<Survey>(emptySurvey);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Survey, string>>>(
    {},
  );
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(
    loadGeneratedPlan,
  );
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    const stored = loadSurvey();
    if (stored) {
      setSurvey(stored);
      setSaved(true);
    }
  }, []);

  const update = (field: keyof Survey, value: string) => {
    setSurvey((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaved(false);
  };

  const validate = () => {
    const next: Partial<Record<keyof Survey, string>> = {};
    const age = Number(survey.age);
    const weight = Number(survey.weight);
    const height = Number(survey.height);

    if (!survey.age || !Number.isInteger(age) || age < 14 || age > 100) {
      next.age = "Podaj wiek od 14 do 100 lat.";
    }
    if (!survey.gender) next.gender = "Wybierz płeć.";
    if (!survey.weight || Number.isNaN(weight) || weight < 30 || weight > 300) {
      next.weight = "Podaj wagę od 30 do 300 kg.";
    }
    if (
      !survey.height ||
      !Number.isInteger(height) ||
      height < 100 ||
      height > 250
    ) {
      next.height = "Podaj wzrost od 100 do 250 cm.";
    }
    if (!survey.experience) next.experience = "Wybierz poziom doświadczenia.";
    if (!survey.goal) next.goal = "Wybierz cel.";
    if (!survey.equipment) next.equipment = "Wybierz dostępny sprzęt.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const generatePlan = async (currentSurvey: Survey) => {
    setGenerating(true);
    setGenerateError("");

    try {
      const response = await fetch(
        "http://localhost:5062/api/aiworkout/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fitnessGoal: currentSurvey.goal,
            experienceLevel: currentSurvey.experience,
            equipmentAvailable: currentSurvey.equipment,
          }),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data?.error ||
          data?.message ||
          "Nie udało się wygenerować propozycji planu.";
        throw new Error(message);
      }

      const nextPlan: GeneratedPlan = {
        planContent: data?.planContent ?? "",
        source: data?.source,
      };
      setGeneratedPlan(nextPlan);
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(nextPlan));
    } catch (err: unknown) {
      setGenerateError(
        err instanceof Error
          ? err.message
          : "Błąd połączenia z serwerem przy generowaniu planu.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(survey));
    setSaved(true);
    await generatePlan(survey);
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      <form
        onSubmit={handleSubmit}
        className="w-full bg-surface border border-line rounded-2xl p-8"
        noValidate
      >
        <h2 className="text-2xl font-bold text-white">Ankieta</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Wiek" error={errors.age}>
            <input
              type="number"
              min={14}
              max={100}
              inputMode="numeric"
              value={survey.age}
              onChange={(event) => update("age", event.target.value)}
              placeholder="np. 25"
              className={inputClass(Boolean(errors.age))}
            />
          </Field>

          <Field label="Płeć" error={errors.gender}>
            <select
              value={survey.gender}
              onChange={(event) => update("gender", event.target.value)}
              className={inputClass(Boolean(errors.gender))}
            >
              <option value="">Wybierz</option>
              {GENDERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Waga (kg)" error={errors.weight}>
            <input
              type="number"
              min={30}
              max={300}
              step="0.1"
              inputMode="decimal"
              value={survey.weight}
              onChange={(event) => update("weight", event.target.value)}
              placeholder="np. 72"
              className={inputClass(Boolean(errors.weight))}
            />
          </Field>

          <Field label="Wzrost (cm)" error={errors.height}>
            <input
              type="number"
              min={100}
              max={250}
              inputMode="numeric"
              value={survey.height}
              onChange={(event) => update("height", event.target.value)}
              placeholder="np. 178"
              className={inputClass(Boolean(errors.height))}
            />
          </Field>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Poziom doświadczenia" error={errors.experience}>
            <select
              value={survey.experience}
              onChange={(event) => update("experience", event.target.value)}
              className={inputClass(Boolean(errors.experience))}
            >
              <option value="">Wybierz</option>
              {EXPERIENCE_LEVELS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Co chcesz osiągnąć?" error={errors.goal}>
            <select
              value={survey.goal}
              onChange={(event) => update("goal", event.target.value)}
              className={inputClass(Boolean(errors.goal))}
            >
              <option value="">Wybierz</option>
              {GOALS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Dostępny sprzęt" error={errors.equipment}>
            <select
              value={survey.equipment}
              onChange={(event) => update("equipment", event.target.value)}
              className={inputClass(Boolean(errors.equipment))}
            >
              <option value="">Wybierz</option>
              {EQUIPMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {saved && (
          <p className="mt-5 text-sm text-mint bg-mint/10 border border-mint/30 rounded-xl px-4 py-3">
            Ankieta zapisana. Możesz zmienić odpowiedzi i zapisać je ponownie.
          </p>
        )}

        <button
          type="submit"
          disabled={generating}
          className="mt-6 w-full py-3 rounded-2xl font-bold bg-mint-strong text-canvas hover:bg-mint disabled:opacity-60 transition-colors"
        >
          {generating
            ? "Generowanie propozycji planu..."
            : "Zapisz ankietę i wygeneruj plan"}
        </button>
      </form>

      {generateError && (
        <div className="rounded-2xl border border-red-700/60 bg-red-950/40 p-5 text-sm text-red-200">
          {generateError}
        </div>
      )}

      {generatedPlan && (
        <section className="w-full rounded-2xl border border-line bg-surface p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-bold text-white">
              Propozycja planu treningowego
            </h3>
            {generatedPlan.source === "openai" && (
              <span className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-medium text-mint">
                OpenAI
              </span>
            )}
          </div>

          {generatedPlan.source === "local" && (
            <p className="mt-2 text-xs text-muted">
              Propozycja ułożona na podstawie bazy ćwiczeń (po dodaniu{" "}
              <code className="text-mist">OpenAi:ApiKey</code> w konfiguracji
              API plan wygeneruje OpenAI).
            </p>
          )}

          <div className="mt-4 whitespace-pre-wrap rounded-xl border border-line bg-inset p-5 text-sm leading-relaxed text-mist">
            {generatedPlan.planContent}
          </div>
        </section>
      )}
    </div>
  );
}

function inputClass(invalid: boolean) {
  return `w-full rounded-xl bg-inset border px-3 py-2.5 text-white placeholder:text-muted outline-none transition-colors ${
    invalid
      ? "border-red-500 focus:border-red-400"
      : "border-line focus:border-mint"
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-sm font-medium text-mist">
        {label}
      </span>
      {children}
      {error && (
        <span className="block mt-1 text-xs text-red-400">{error}</span>
      )}
    </label>
  );
}
