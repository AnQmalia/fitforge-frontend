import { useState, useEffect, useMemo } from "react";
import chestIcon from "../../ic_chip_chest_b.svg";
import backIcon from "../../ic_chip_back_b.svg";
import bicepsIcon from "../../chip_biceps_b.svg";
import tricepsIcon from "../../chip_triceps_b.svg";
import quadricepsIcon from "../../chip_quadriceps_b.svg";
import hamstringsIcon from "../../chip_hamstrings_b.svg";
import shouldersIcon from "../../ic_chip_shoulders_b.svg";
import hipsIcon from "../../ic_chip_hips_b.svg";
import absIcon from "../../chip_abs_b.svg";
import calvesIcon from "../../ic_chip_calves_b.svg";
import forearmsIcon from "../../ic_chip_forearms_b.svg";

const muscleIcons: Record<string, string> = {
  "Klatka piersiowa": chestIcon,
  Plecy: backIcon,
  Biceps: bicepsIcon,
  Triceps: tricepsIcon,
  "Czworogłowe uda": quadricepsIcon,
  "Dwugłowe uda": hamstringsIcon,
  Barki: shouldersIcon,
  Biodra: hipsIcon,
  Brzuch: absIcon,
  Łydki: calvesIcon,
  Przedramiona: forearmsIcon,
};

const muscleOrder = [
  "Cardio",
  "Łydki",
  "Czworogłowe uda",
  "Dwugłowe uda",
  "Biodra",
  "Brzuch",
  "Plecy",
  "Klatka piersiowa",
  "Barki",
  "Biceps",
  "Triceps",
  "Przedramiona",
];

function orderGroups(groups: MuscleGroup[]) {
  return groups
    .filter((group) => group.name !== "Nogi")
    .sort((a, b) => {
      const aIndex = muscleOrder.indexOf(a.name);
      const bIndex = muscleOrder.indexOf(b.name);
      return (aIndex === -1 ? muscleOrder.length : aIndex) -
        (bIndex === -1 ? muscleOrder.length : bIndex);
    });
}

function HeartPulseIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-11 w-11">
      <path
        d="M24 39.5c-.4 0-12.8-7.2-16.4-14.4C4.8 20.2 7.2 13.6 13.4 12.8c3.4-.4 6.2 1.2 8.2 4.2 1.1 1.6 1.6 2.2 2.4 2.2s1.3-.6 2.4-2.2c2-3 4.8-4.6 8.2-4.2 6.2.8 8.6 7.4 5.8 12.3C36.8 32.3 24.4 39.5 24 39.5z"
        fill="#E74C3C"
      />
      <path
        d="M7 24.5h7.2l2.6-5.2 4.4 9.2 2.8-4h16"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

const FAVORITES_KEY = "fitforge-favorites";

function readFavorites(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "number")
      : [];
  } catch {
    return [];
  }
}

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
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(readFavorites);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!selected && !formOpen && !pendingDelete) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setFormOpen(false);
        setPendingDelete(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, formOpen, pendingDelete]);

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
            muscleGroup: { id: 9, name: "Czworogłowe uda" },
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

  const groups = useMemo(() => {
    if (muscleGroups.length > 0) return orderGroups(muscleGroups);

    const byId = new Map<number, MuscleGroup>();
    for (const exercise of exercises) {
      if (exercise.muscleGroup) byId.set(exercise.muscleGroup.id, exercise.muscleGroup);
    }
    return orderGroups(Array.from(byId.values()));
  }, [muscleGroups, exercises]);

  const visibleExercises = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pl");

    return exercises.filter((exercise) => {
      const matchesName =
        needle.length === 0 ||
        exercise.name.toLocaleLowerCase("pl").includes(needle);
      const matchesGroup =
        selectedGroupIds.length === 0 ||
        (exercise.muscleGroup != null &&
          selectedGroupIds.includes(exercise.muscleGroup.id));
      const matchesFavorite =
        !favoritesOnly || favoriteIds.includes(exercise.id);

      return matchesName && matchesGroup && matchesFavorite;
    });
  }, [exercises, query, selectedGroupIds, favoritesOnly, favoriteIds]);

  const toggleGroup = (id: number) => {
    setSelectedGroupIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleFavorite = (id: number) => {
    setFavoriteIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

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

  const requestDelete = (exercise: Exercise) => {
    setDeleteError("");
    setPendingDelete(exercise);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `http://localhost:5062/api/exercises/${pendingDelete.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const message = (await response.text()).trim();
        throw new Error(message || "Nie udało się usunąć ćwiczenia.");
      }

      const id = pendingDelete.id;
      setExercises((current) => current.filter((item) => item.id !== id));
      setFavoriteIds((current) => {
        const next = current.filter((item) => item !== id);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        return next;
      });
      setSelected((current) => (current?.id === id ? null : current));
      setPendingDelete(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Błąd połączenia z serwerem.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {!loading && (
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj ćwiczenia po nazwie"
              aria-label="Szukaj ćwiczenia po nazwie"
              className="w-80 rounded-full border border-gray-600 bg-gray-900 px-5 py-2.5 text-base text-white placeholder:text-gray-500 sm:w-96"
            />
            {!error ? (
              <button
                type="button"
                onClick={openForm}
                className="justify-self-end rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Dodaj ćwiczenie
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Ulubione"
              aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly((current) => !current)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                favoritesOnly
                  ? "border-amber-400 bg-amber-950/40 text-amber-200"
                  : "border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill={favoritesOnly ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.5 4.75h11a1 1 0 0 1 1 1v14.1a.6.6 0 0 1-.94.5L12 16.4l-5.56 4a.6.6 0 0 1-.94-.5V5.75a1 1 0 0 1 1-1Z"
                />
              </svg>
            </button>

            <div className="flex min-w-0 flex-1 flex-wrap justify-center gap-2">
              {filtersOpen &&
                groups.map((group) => {
                  const active = selectedGroupIds.includes(group.id);
                  const icon = muscleIcons[group.name];
                  const isPulse = group.name === "Cardio";
                  return (
                    <button
                      key={group.id}
                      type="button"
                      aria-label={group.name}
                      title={group.name}
                      aria-pressed={active}
                      onClick={() => toggleGroup(group.id)}
                      className={
                        icon || isPulse
                          ? `flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border ${
                              active
                                ? "border-blue-400 bg-gray-800"
                                : "border-gray-600 bg-gray-900 hover:border-gray-500"
                            }`
                          : `rounded-md border px-3 py-1.5 text-sm ${
                              active
                                ? "border-blue-400 bg-blue-600 text-white"
                                : "border-gray-600 bg-gray-900 text-gray-300 hover:border-gray-500"
                            }`
                      }
                    >
                      {isPulse ? (
                        <HeartPulseIcon />
                      ) : icon ? (
                        <img src={icon} alt="" className="h-11 w-11" />
                      ) : (
                        group.name
                      )}
                    </button>
                  );
                })}
            </div>

            <button
              type="button"
              aria-label="Filtry"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                filtersOpen || selectedGroupIds.length > 0
                  ? "border-blue-500 bg-blue-950/50 text-blue-200"
                  : "border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                <circle cx="9" cy="7" r="2.1" fill="currentColor" stroke="none" />
                <circle cx="15" cy="12" r="2.1" fill="currentColor" stroke="none" />
                <circle cx="8" cy="17" r="2.1" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>
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

      {!loading && visibleExercises.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">
          Brak ćwiczeń dla tych filtrów.
        </p>
      )}

      {!loading && visibleExercises.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-gray-800 border border-gray-700/80 rounded-2xl p-6 shadow-xl hover:border-blue-500 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {exercise.name}
                  </h3>
                  <button
                    type="button"
                    aria-pressed={favoriteIds.includes(exercise.id)}
                    aria-label={
                      favoriteIds.includes(exercise.id)
                        ? "Usuń z ulubionych"
                        : "Dodaj do ulubionych"
                    }
                    onClick={() => toggleFavorite(exercise.id)}
                    className={`text-lg leading-none ${
                      favoriteIds.includes(exercise.id)
                        ? "text-amber-300"
                        : "text-gray-500 hover:text-amber-200"
                    }`}
                  >
                    {favoriteIds.includes(exercise.id) ? "★" : "☆"}
                  </button>
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
                {!error && (
                  <button
                    type="button"
                    onClick={() => requestDelete(exercise)}
                    className="font-semibold text-red-300 hover:underline"
                  >
                    Usuń
                  </button>
                )}
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
                  {groups.map((group) => (
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

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
          onClick={() => {
            if (!deleting) setPendingDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-exercise-title"
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="delete-exercise-title" className="text-xl font-bold text-white">
              Usunąć ćwiczenie?
            </h3>
            <p className="mt-3 text-sm text-gray-300">{pendingDelete.name}</p>
            {deleteError && <p className="mt-3 text-sm text-red-300">{deleteError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="rounded-xl px-4 py-2 text-sm text-gray-300 hover:text-white disabled:opacity-60"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {deleting ? "Usuwanie..." : "Usuń"}
              </button>
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
