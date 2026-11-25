import { useEffect, useMemo, useState, type ReactNode } from "react";

const ACTIVITIES = [
  { id: "low", label: "Niska — siedzący tryb", factor: 1.2 },
  { id: "light", label: "Lekka — 1–2 treningi", factor: 1.375 },
  { id: "medium", label: "Umiarkowana — 3–4 treningi", factor: 1.55 },
  { id: "high", label: "Wysoka — 5–6 treningów", factor: 1.725 },
  { id: "very-high", label: "Bardzo wysoka — codziennie", factor: 1.9 },
] as const;

const GOAL_OFFSET: Record<string, number> = {
  Schudnąć: -500,
  "Zbudować masę mięśniową": 300,
  "Zwiększyć siłę": 200,
  "Poprawić kondycję": 0,
  "Utrzymać formę": 0,
};

interface FormState {
  age: string;
  gender: string;
  weight: string;
  height: string;
  goal: string;
  activity: string;
}

const emptyForm: FormState = {
  age: "",
  gender: "",
  weight: "",
  height: "",
  goal: "Utrzymać formę",
  activity: "medium",
};

export default function CalorieTab() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [filledFromSurvey, setFilledFromSurvey] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fitforge-survey");
      if (!raw) return;
      const survey = JSON.parse(raw) as Partial<FormState>;
      setForm((current) => ({
        ...current,
        age: survey.age ?? current.age,
        gender: survey.gender ?? current.gender,
        weight: survey.weight ?? current.weight,
        height: survey.height ?? current.height,
        goal: survey.goal || current.goal,
      }));
      setFilledFromSurvey(true);
    } catch {
      setFilledFromSurvey(false);
    }
  }, []);

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const result = useMemo(() => {
    const age = Number(form.age);
    const weight = Number(form.weight);
    const height = Number(form.height);
    const activity = ACTIVITIES.find((item) => item.id === form.activity);

    if (!Number.isInteger(age) || age < 14 || age > 100) return null;
    if (Number.isNaN(weight) || weight < 30 || weight > 300) return null;
    if (!Number.isInteger(height) || height < 100 || height > 250) return null;
    if (!form.gender || !activity) return null;

    const base = 10 * weight + 6.25 * height - 5 * age;
    const bmr =
      form.gender === "Mężczyzna"
        ? base + 5
        : form.gender === "Kobieta"
          ? base - 161
          : base - 78;

    const tdee = bmr * activity.factor;
    const offset = GOAL_OFFSET[form.goal] ?? 0;
    const target = Math.max(1200, Math.round(tdee + offset));
    const bmi = weight / (height / 100) ** 2;

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target,
      offset,
      bmi: Math.round(bmi * 10) / 10,
      bmiLabel: bmiCategory(bmi),
    };
  }, [form]);

  return (
    <div className="w-full max-w-xl">
      <section className="bg-surface border border-line rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white">Kalkulator kalorii</h2>
        <p className="mt-2 text-sm text-muted">
          Liczy zapotrzebowanie wzorem Mifflina–St Jeora. Wynik jest orientacyjny.
        </p>
        {filledFromSurvey && (
          <p className="mt-3 text-sm text-mint">Uzupełnione danymi z ankiety. Możesz je zmienić.</p>
        )}

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Wiek">
            <input
              type="number"
              min={14}
              max={100}
              value={form.age}
              onChange={(event) => update("age", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Płeć">
            <select
              value={form.gender}
              onChange={(event) => update("gender", event.target.value)}
              className={inputClass}
            >
              <option value="">Wybierz</option>
              <option value="Kobieta">Kobieta</option>
              <option value="Mężczyzna">Mężczyzna</option>
              <option value="Inna">Inna</option>
            </select>
          </Field>
          <Field label="Waga (kg)">
            <input
              type="number"
              min={30}
              max={300}
              step="0.1"
              value={form.weight}
              onChange={(event) => update("weight", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Wzrost (cm)">
            <input
              type="number"
              min={100}
              max={250}
              value={form.height}
              onChange={(event) => update("height", event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Aktywność">
            <select
              value={form.activity}
              onChange={(event) => update("activity", event.target.value)}
              className={inputClass}
            >
              {ACTIVITIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cel">
            <select
              value={form.goal}
              onChange={(event) => update("goal", event.target.value)}
              className={inputClass}
            >
              {Object.keys(GOAL_OFFSET).map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {result && (
        <>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Result label="BMI" value={result.bmi.toFixed(1)} hint={result.bmiLabel} />
            <Result label="BMR" value={`${result.bmr} kcal`} hint="spoczynek" />
            <Result label="TDEE" value={`${result.tdee} kcal`} hint="z aktywnością" />
            <Result
              label="Cel"
              value={`${result.target} kcal`}
              hint={
                result.offset === 0
                  ? "utrzymanie"
                  : result.offset > 0
                    ? `+${result.offset} kcal`
                    : `${result.offset} kcal`
              }
            />
          </div>
          <dl className="mt-4 space-y-2 text-sm text-muted">
            <div>
              <dt className="inline font-semibold text-mist">BMI</dt>
              <dd className="inline"> — Body Mass Index, masa podzielona przez wzrost w metrach do kwadratu. Poniżej 18,5 to niedowaga, 18,5–24,9 norma, 25–29,9 nadwaga, od 30 otyłość.</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-mist">BMR</dt>
              <dd className="inline"> — Basal Metabolic Rate, kalorie spalane w spoczynku, bez ruchu i treningu.</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-mist">TDEE</dt>
              <dd className="inline"> — Total Daily Energy Expenditure, BMR pomnożone przez aktywność z całego dnia.</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-mist">Cel</dt>
              <dd className="inline"> — TDEE skorygowane o cel: minus przy chudnięciu, plus przy masie i sile.</dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "niedowaga";
  if (bmi < 25) return "norma";
  if (bmi < 30) return "nadwaga";
  return "otyłość";
}

const inputClass =
  "mt-1.5 w-full rounded-xl bg-inset border border-line px-3 py-2.5 text-white outline-none focus:border-mint";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-mist">
      {label}
      {children}
    </label>
  );
}

function Result({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="bg-surface border border-line rounded-2xl p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-mint">{hint}</p>
    </article>
  );
}
