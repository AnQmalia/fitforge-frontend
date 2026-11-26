import { useEffect, useState } from "react";

interface SavedItem {
  id: number;
  exerciseName: string;
  targetReps: number;
  weight: number;
  setNumber: number;
  exerciseOrder: number;
}

interface SavedPlan {
  id: number;
  name: string;
  createdAt: string;
  items: SavedItem[];
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" });
}

function groupExercises(items: SavedItem[]) {
  const groups = new Map<number, SavedItem[]>();
  for (const item of items) {
    const group = groups.get(item.exerciseOrder) ?? [];
    group.push(item);
    groups.set(item.exerciseOrder, group);
  }

  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([order, sets]) => ({
      order,
      name: sets[0].exerciseName,
      sets: [...sets].sort((a, b) => a.setNumber - b.setNumber),
    }));
}

export default function HistoryTab() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("http://localhost:5062/api/workoutplans");
        if (!response.ok) throw new Error("Nie udało się pobrać historii.");
        setPlans(await response.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Błąd połączenia z serwerem.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-white">Historia</h2>
      <p className="mt-2 text-sm text-muted">
        Prowizoryczny podgląd zapisanych planów, od najnowszego.
      </p>

      {loading && <p className="mt-6 text-muted">Ładowanie historii...</p>}

      {error && (
        <p className="mt-6 p-4 bg-surface border border-mint/30 text-mint rounded-xl text-sm">
          Serwer backendu nie zwrócił danych (lub jest wyłączony).
        </p>
      )}

      {!loading && !error && plans.length === 0 && (
        <p className="mt-6 text-sm text-muted">
          Nie ma jeszcze zapisanych planów. Ułóż pierwszy w zakładce Plan treningowy.
        </p>
      )}

      {!loading && !error && plans.length > 0 && (
        <div className="mt-6 space-y-4">
          {plans.map((plan) => (
            <article key={plan.id} className="bg-surface border border-line rounded-2xl p-5">
              <div className="flex justify-between gap-3 items-start">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <span className="text-xs text-muted shrink-0">{formatDate(plan.createdAt)}</span>
              </div>
              <div className="mt-3 space-y-3">
                {groupExercises(plan.items).map((exercise) => (
                  <div key={`${plan.id}-${exercise.order}`}>
                    <p className="text-sm font-semibold text-white">{exercise.name}</p>
                    <ul className="mt-2 space-y-2">
                      {exercise.sets.map((set) => (
                        <li
                          key={set.id}
                          className="bg-inset border border-line rounded-xl px-3 py-2 text-sm text-mist"
                        >
                          Seria {set.setNumber}: {set.weight} kg × {set.targetReps} powtórzeń
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
