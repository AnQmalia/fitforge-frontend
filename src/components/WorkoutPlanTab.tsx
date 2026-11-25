import { useEffect, useState } from "react";

interface MuscleGroup {
  id: number;
  name: string;
}

interface Exercise {
  id: number;
  name: string;
  muscleGroup?: MuscleGroup;
}

interface DraftSet {
  key: number;
  weight: string;
  reps: string;
}

interface DraftExercise {
  key: number;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  sets: DraftSet[];
}

interface SavedItem {
  id: number;
  exerciseId: number;
  exerciseName: string;
  targetReps: number;
  weight: number;
  setNumber: number;
  exerciseOrder: number;
}

interface SavedPlan {
  id: number;
  name: string;
  items: SavedItem[];
}

let nextKey = 1;

function createSet(): DraftSet {
  return { key: nextKey++, weight: "", reps: "" };
}

export default function WorkoutPlanTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [planName, setPlanName] = useState("Mój plan");
  const [draft, setDraft] = useState<DraftExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const loadPlans = async () => {
    const response = await fetch("http://localhost:5062/api/workoutplans");
    if (!response.ok) throw new Error("Nie udało się pobrać planów.");
    setPlans(await response.json());
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [exerciseResponse] = await Promise.all([
          fetch("http://localhost:5062/api/exercises"),
          loadPlans(),
        ]);

        if (!exerciseResponse.ok) {
          throw new Error("Nie udało się pobrać bazy ćwiczeń.");
        }

        setExercises(await exerciseResponse.json());
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : "Błąd połączenia z serwerem.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pickerOpen]);

  const addExercise = (exercise: Exercise) => {
    setDraft((current) => [
      ...current,
      {
        key: nextKey++,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup?.name ?? "",
        sets: [createSet()],
      },
    ]);
    setPickerOpen(false);
    setSavedMessage("");
    setFormError("");
  };

  const addSet = (exerciseKey: number) => {
    setDraft((current) =>
      current.map((exercise) =>
        exercise.key === exerciseKey
          ? { ...exercise, sets: [...exercise.sets, createSet()] }
          : exercise
      )
    );
    setSavedMessage("");
  };

  const updateSet = (exerciseKey: number, setKey: number, patch: Partial<DraftSet>) => {
    setDraft((current) =>
      current.map((exercise) =>
        exercise.key === exerciseKey
          ? {
              ...exercise,
              sets: exercise.sets.map((set) => (set.key === setKey ? { ...set, ...patch } : set)),
            }
          : exercise
      )
    );
    setSavedMessage("");
  };

  const removeSet = (exerciseKey: number, setKey: number) => {
    setDraft((current) =>
      current.map((exercise) => {
        if (exercise.key !== exerciseKey) return exercise;
        const sets = exercise.sets.filter((set) => set.key !== setKey);
        return { ...exercise, sets: sets.length > 0 ? sets : [createSet()] };
      })
    );
    setSavedMessage("");
  };

  const removeExercise = (exerciseKey: number) => {
    setDraft((current) => current.filter((exercise) => exercise.key !== exerciseKey));
    setSavedMessage("");
  };

  const savePlan = async () => {
    if (!planName.trim()) {
      setFormError("Podaj nazwę planu.");
      return;
    }
    if (draft.length === 0) {
      setFormError("Dodaj co najmniej jedno ćwiczenie.");
      return;
    }

    for (const exercise of draft) {
      for (const set of exercise.sets) {
        const weight = Number(set.weight);
        const reps = Number(set.reps);
        if (set.weight.trim() === "" || Number.isNaN(weight) || weight < 0) {
          setFormError(`Podaj ciężar przy „${exercise.exerciseName}”.`);
          return;
        }
        if (!Number.isInteger(reps) || reps < 1) {
          setFormError(`Podaj liczbę powtórzeń przy „${exercise.exerciseName}”.`);
          return;
        }
      }
    }

    setSaving(true);
    setFormError("");
    setSavedMessage("");

    try {
      const response = await fetch("http://localhost:5062/api/workoutplans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 0,
          name: planName.trim(),
          items: draft.flatMap((exercise, exerciseIndex) =>
            exercise.sets.map((set, setIndex) => ({
              exerciseId: exercise.exerciseId,
              dayOfWeek: "",
              sets: 1,
              targetReps: Number(set.reps),
              weight: Number(set.weight),
              setNumber: setIndex + 1,
              exercisesOrder: exerciseIndex + 1,
            }))
          ),
        }),
      });

      if (!response.ok) throw new Error("Nie udało się zapisać planu.");

      await loadPlans();
      setSavedMessage("Plan zapisany.");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Błąd połączenia z serwerem.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      <section className="bg-gray-800 border border-gray-700/80 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white">Plan treningowy</h2>
        <p className="mt-2 text-sm text-gray-400">
          Dodaj ćwiczenie z bazy. Każda seria ma swój ciężar i liczbę powtórzeń.
        </p>

        {loading && <p className="mt-6 text-gray-400">Ładowanie...</p>}

        {loadError && (
          <p className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded-xl text-sm">
            Serwer backendu nie zwrócił danych (lub jest wyłączony).
          </p>
        )}

        {!loading && !loadError && (
          <>
            <label className="block mt-5 text-sm text-gray-300" htmlFor="plan-name">
              Nazwa planu
            </label>
            <input
              id="plan-name"
              value={planName}
              onChange={(event) => {
                setPlanName(event.target.value);
                setSavedMessage("");
              }}
              className="mt-1.5 w-full rounded-xl bg-gray-900 border border-gray-600 px-3 py-2.5 text-white outline-none focus:border-green-500"
            />

            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-4 w-full py-3 rounded-2xl font-bold bg-gray-900 border border-green-700 text-green-300 hover:bg-green-950"
            >
              Dodaj ćwiczenie
            </button>

            {draft.length === 0 && (
              <p className="mt-4 text-sm text-gray-400">Plan jest pusty.</p>
            )}

            <div className="mt-4 space-y-4">
              {draft.map((exercise, index) => (
                <article key={exercise.key} className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white">
                        {index + 1}. {exercise.exerciseName}
                      </h3>
                      {exercise.muscleGroup && (
                        <p className="text-xs text-gray-400">{exercise.muscleGroup}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.key)}
                      className="text-sm text-red-300 hover:text-red-200"
                    >
                      Usuń
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={set.key}>
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-gray-400">
                              Seria {setIndex + 1}
                            </span>
                            {exercise.sets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSet(exercise.key, set.key)}
                                className="text-xs text-gray-500 hover:text-red-300"
                              >
                                Usuń serię
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-xs text-gray-400">
                              Ciężar (kg)
                              <input
                                type="number"
                                min={0}
                                step="0.5"
                                value={set.weight}
                                onChange={(event) =>
                                  updateSet(exercise.key, set.key, { weight: event.target.value })
                                }
                                className="mt-1 w-full rounded-lg bg-gray-900 border border-gray-600 px-2 py-2 text-sm text-white"
                              />
                            </label>
                            <label className="text-xs text-gray-400">
                              Powtórzenia
                              <input
                                type="number"
                                min={1}
                                step="1"
                                value={set.reps}
                                onChange={(event) =>
                                  updateSet(exercise.key, set.key, { reps: event.target.value })
                                }
                                className="mt-1 w-full rounded-lg bg-gray-900 border border-gray-600 px-2 py-2 text-sm text-white"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addSet(exercise.key)}
                    aria-label={`Dodaj serię do ${exercise.exerciseName}`}
                    className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-green-600 hover:bg-green-500 text-xl font-bold leading-none"
                  >
                    +
                  </button>
                </article>
              ))}
            </div>

            {formError && <p className="mt-4 text-sm text-red-400">{formError}</p>}
            {savedMessage && <p className="mt-4 text-sm text-green-300">{savedMessage}</p>}

            <button
              type="button"
              onClick={savePlan}
              disabled={saving}
              className="mt-5 w-full py-3 rounded-2xl font-bold bg-green-600 hover:bg-green-500 disabled:opacity-60"
            >
              {saving ? "Zapisywanie..." : "Zapisz plan"}
            </button>
          </>
        )}
      </section>

      {!loading && plans.length > 0 && (
        <section className="mt-6 space-y-4">
          <h3 className="font-bold text-white">Zapisane plany</h3>
          {plans.map((plan) => {
            const groups = new Map<number, SavedItem[]>();
            for (const item of plan.items) {
              const group = groups.get(item.exerciseOrder) ?? [];
              group.push(item);
              groups.set(item.exerciseOrder, group);
            }

            return (
              <article key={plan.id} className="bg-gray-800 border border-gray-700/80 rounded-2xl p-5">
                <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                <div className="mt-3 space-y-3">
                  {[...groups.entries()]
                    .sort((a, b) => a[0] - b[0])
                    .map(([order, sets]) => (
                      <div key={order}>
                        <p className="text-sm font-semibold text-white">{sets[0].exerciseName}</p>
                        <ul className="mt-2 space-y-2">
                          {[...sets]
                            .sort((a, b) => a.setNumber - b.setNumber)
                            .map((set) => (
                              <li
                                key={set.id}
                                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-300"
                              >
                                Seria {set.setNumber}: {set.weight} kg × {set.targetReps} powtórzeń
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setPickerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exercise-picker-title"
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center gap-3">
              <h3 id="exercise-picker-title" className="text-lg font-bold text-white">
                Wybierz ćwiczenie
              </h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Zamknij
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    onClick={() => addExercise(exercise)}
                    className="w-full text-left bg-gray-900 border border-gray-700 hover:border-green-600 rounded-xl px-4 py-3"
                  >
                    <span className="block font-medium text-white">{exercise.name}</span>
                    {exercise.muscleGroup?.name && (
                      <span className="block text-xs text-gray-400">{exercise.muscleGroup.name}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
