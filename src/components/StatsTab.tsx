import { useEffect, useState } from "react";

interface SavedItem {
  id: number;
  exerciseName: string;
  targetReps: number;
  weight: number;
  setNumber: number;
}

interface SavedPlan {
  id: number;
  name: string;
  items: SavedItem[];
}

interface Survey {
  goal?: string;
  weight?: string;
  experience?: string;
}

export default function StatsTab() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fitforge-survey");
      if (raw) setSurvey(JSON.parse(raw) as Survey);
    } catch {
      setSurvey(null);
    }

    const load = async () => {
      try {
        const response = await fetch("http://localhost:5062/api/workoutplans");
        if (!response.ok) throw new Error("Nie udało się pobrać statystyk.");
        setPlans(await response.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Błąd połączenia z serwerem.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const items = plans.flatMap((plan) => plan.items);
  const totalReps = items.reduce((sum, item) => sum + item.targetReps, 0);
  const volume = items.reduce((sum, item) => sum + item.weight * item.targetReps, 0);
  const heaviest = items.reduce<SavedItem | null>(
    (best, item) => (best === null || item.weight > best.weight ? item : best),
    null
  );

  const byExercise = new Map<string, number>();
  for (const item of items) {
    byExercise.set(item.exerciseName, (byExercise.get(item.exerciseName) ?? 0) + 1);
  }
  const exerciseRows = [...byExercise.entries()].sort((a, b) => b[1] - a[1]);
  const maxSets = exerciseRows[0]?.[1] ?? 1;

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-white">Statystyki</h2>
      <p className="mt-2 text-sm text-gray-400">
        Prowizoryczne podsumowanie zapisanych planów. To jeszcze nie dziennik treningów.
      </p>

      {loading && <p className="mt-6 text-gray-400">Liczenie statystyk...</p>}

      {error && (
        <p className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded-xl text-sm">
          Serwer backendu nie zwrócił danych (lub jest wyłączony).
        </p>
      )}

      {!loading && !error && (
        <>
          {survey && (survey.goal || survey.weight || survey.experience) && (
            <p className="mt-4 text-sm text-gray-300">
              Z ankiety:{" "}
              {[
                survey.goal ? `cel — ${survey.goal}` : "",
                survey.experience ? `poziom — ${survey.experience}` : "",
                survey.weight ? `waga — ${survey.weight} kg` : "",
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat label="Plany" value={String(plans.length)} />
            <Stat label="Serie" value={String(items.length)} />
            <Stat label="Powtórzenia" value={String(totalReps)} />
            <Stat label="Objętość" value={`${volume} kg`} />
          </div>

          <article className="mt-4 bg-gray-800 border border-gray-700/80 rounded-2xl p-5">
            <h3 className="font-bold text-white">Najcięższa seria</h3>
            {heaviest && heaviest.weight > 0 ? (
              <p className="mt-2 text-sm text-gray-300">
                {heaviest.exerciseName}: {heaviest.weight} kg × {heaviest.targetReps} powtórzeń
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-400">Brak serii z podanym ciężarem.</p>
            )}
          </article>

          <article className="mt-4 bg-gray-800 border border-gray-700/80 rounded-2xl p-5">
            <h3 className="font-bold text-white">Serie według ćwiczenia</h3>
            {exerciseRows.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">
                Zapisz plan, żeby pojawiło się zestawienie.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {exerciseRows.map(([name, count]) => (
                  <li key={name}>
                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>{name}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-900">
                      <div
                        className="h-2 rounded-full bg-green-600"
                        style={{ width: `${(count / maxSets) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
