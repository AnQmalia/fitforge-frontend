import { useEffect, useState, type FormEvent, type ReactNode } from "react";

const STORAGE_KEY = "fitforge-survey";

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

interface Survey {
  age: string;
  gender: string;
  weight: string;
  height: string;
  experience: string;
  goal: string;
}

const emptySurvey: Survey = {
  age: "",
  gender: "",
  weight: "",
  height: "",
  experience: "",
  goal: "",
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

export default function GeneratorTab() {
  const [survey, setSurvey] = useState<Survey>(emptySurvey);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Survey, string>>>(
    {},
  );

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

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(survey));
    setSaved(true);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl bg-gray-800 border border-gray-700/80 rounded-2xl p-8 shadow-xl"
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
      </div>

      {saved && (
        <p className="mt-5 text-sm text-green-300 bg-green-950/40 border border-green-800/50 rounded-xl px-4 py-3">
          Ankieta zapisana. Możesz zmienić odpowiedzi i zapisać je ponownie.
        </p>
      )}

      <button
        type="submit"
        className="mt-6 w-full py-3 rounded-2xl font-bold bg-green-600 hover:bg-green-500 transition-colors"
      >
        Zapisz ankietę
      </button>
    </form>
  );
}

function inputClass(invalid: boolean) {
  return `w-full rounded-xl bg-gray-900 border px-3 py-2.5 text-white outline-none transition-colors ${
    invalid
      ? "border-red-500 focus:border-red-400"
      : "border-gray-600 focus:border-green-500"
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
      <span className="block mb-1.5 text-sm font-medium text-gray-300">
        {label}
      </span>
      {children}
      {error && (
        <span className="block mt-1 text-xs text-red-400">{error}</span>
      )}
    </label>
  );
}
