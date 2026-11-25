import { useState, useEffect } from "react";

interface MuscleGroup {
  id: number;
  name: string;
}

interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscleGroup?: MuscleGroup;
  equipmentNeeded?: string;
}

const emptyForm = {
  name: "",
  muscleGroupId: "",
  equipmentNeeded: "",
  description: "",
};

export default function ExercisesTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected && !formOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setFormOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, formOpen]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const [response, groupsResponse] = await Promise.all([
          fetch("http://localhost:5062/api/exercises"),
          fetch("http://localhost:5062/api/musclegroups"),
        ]);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać bazy ćwiczeń z serwera.");
        }

        const data = await response.json();
        setExercises(data);

        if (groupsResponse.ok) {
          setMuscleGroups(await groupsResponse.json());
        }
      } catch (err: any) {
        setError(err.message || "Błąd połączenia z serwerem.");

        setExercises([
          {
            id: 1,
            name: "Wyciskanie sztangi na ławce poziomej",
            muscleGroup: { id: 1, name: "Klatka piersiowa" },
            equipmentNeeded: "Sztanga, ławka",
          },
          {
            id: 2,
            name: "Przysiady ze sztangą na plecach",
            muscleGroup: { id: 2, name: "Nogi" },
            equipmentNeeded: "Sztanga, stojaki",
          },
          {
            id: 3,
            name: "Martwy ciąg klasyczny",
            muscleGroup: { id: 3, name: "Plecy" },
            equipmentNeeded: "Sztanga",
          },
          {
            id: 4,
            name: "Podciąganie na drążku nachwytem",
            muscleGroup: { id: 3, name: "Plecy" },
            equipmentNeeded: "Drążek",
          },
          {
            id: 5,
            name: "Wyciskanie żołnierskie",
            muscleGroup: { id: 4, name: "Barki" },
            equipmentNeeded: "Sztanga",
          },
          {
            id: 6,
            name: "Uginanie przedramion z hantlami",
            muscleGroup: { id: 5, name: "Biceps" },
            equipmentNeeded: "Hantle",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const openForm = () => {
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const saveExercise = async () => {
    const name = form.name.trim();
    if (!name) {
      setFormError("Podaj nazwę ćwiczenia.");
      return;
    }
    if (!form.muscleGroupId) {
      setFormError("Wybierz partię mięśniową.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch("http://localhost:5062/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          muscleGroupId: Number(form.muscleGroupId),
          equipmentNeeded: form.equipmentNeeded.trim(),
          description: form.description.trim(),
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Nie udało się zapisać ćwiczenia.");
      }

      const created: Exercise = await response.json();
      setExercises((current) => [...current, created]);
      setFormOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      setFormError(err.message || "Błąd połączenia z serwerem.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {!loading && !error && (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={openForm}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Dodaj ćwiczenie
          </button>
        </div>
      )}
      {loading && (
        <div className="text-center text-gray-400 py-12 text-lg">
          Pobieranie ćwiczeń...
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded-xl text-center text-sm shadow-lg">
          Serwer backendu nie zwrócił danych (lub jest wyłączony).
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-gray-800 border border-gray-700/80 rounded-2xl p-6 shadow-xl hover:border-blue-500 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {exercise.name}
                  </h3>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full font-semibold border border-gray-600">
                    #{exercise.id}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-300">
                  {exercise.muscleGroup?.name && (
                    <p className="flex items-center space-x-2">
                      <span className="text-gray-400">Partia:</span>
                      <span className="font-medium text-blue-300 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/50">
                        {exercise.muscleGroup.name}
                      </span>
                    </p>
                  )}
                  {exercise.equipmentNeeded && (
                    <p className="text-gray-400">
                      <span className="text-gray-400 font-medium">Sprzęt:</span>{" "}
                      {exercise.equipmentNeeded}
                    </p>
                  )}
                  {exercise.description && (
                    <p className="mt-3 text-gray-400 text-xs leading-relaxed line-clamp-3">
                      {exercise.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => setSelected(exercise)}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  Szczegóły &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setFormOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-exercise-title"
            className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4">
              <h3 id="add-exercise-title" className="text-xl font-bold text-white">
                Nowe ćwiczenie
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Zamknij
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm text-gray-300">
                Nazwa
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-900 px-3 py-2 text-white"
                />
              </label>

              <label className="block text-sm text-gray-300">
                Partia mięśniowa
                <select
                  value={form.muscleGroupId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      muscleGroupId: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-900 px-3 py-2 text-white"
                >
                  <option value="">Wybierz</option>
                  {muscleGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-gray-300">
                Sprzęt
                <input
                  value={form.equipmentNeeded}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      equipmentNeeded: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-900 px-3 py-2 text-white"
                />
              </label>

              <label className="block text-sm text-gray-300">
                Opis
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-900 px-3 py-2 text-white"
                />
              </label>

              {formError && (
                <p className="text-sm text-red-300">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-gray-300 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={saveExercise}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {saving ? "Zapisywanie..." : "Zapisz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exercise-details-title"
            className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4">
              <h3
                id="exercise-details-title"
                className="text-xl font-bold text-white"
              >
                {selected.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Zamknij
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-300">
              {selected.muscleGroup?.name && (
                <p>
                  <span className="text-gray-400">Partia: </span>
                  {selected.muscleGroup.name}
                </p>
              )}
              {selected.equipmentNeeded && (
                <p>
                  <span className="text-gray-400">Sprzęt: </span>
                  {selected.equipmentNeeded}
                </p>
              )}
              <p className="pt-2 text-gray-300 leading-relaxed">
                {selected.description || "Opis ćwiczenia."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
