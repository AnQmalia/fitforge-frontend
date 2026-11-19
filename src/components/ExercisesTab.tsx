import { useState, useEffect } from "react";

// Interfejs opisujący strukturę ćwiczenia
interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscleGroup?: string;
  equipmentRequired?: string;
}

export default function ExercisesTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        // Zapytanie do Twojego backendu .NET (dostosuj ścieżkę, jeśli jest inna, np. /api/exercises)
        const response = await fetch("http://localhost:5062/api/exercises");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać bazy ćwiczeń z serwera.");
        }

        const data = await response.json();
        setExercises(data);
      } catch (err: any) {
        setError(err.message || "Błąd połączenia z serwerem.");

        // Dane awaryjne (mock), żebyś od razu zobaczył jak wyglądają kafelki
        setExercises([
          {
            id: 1,
            name: "Wyciskanie sztangi na ławce poziomej",
            muscleGroup: "Klatka piersiowa",
            equipmentRequired: "Sztanga, Ławka",
          },
          {
            id: 2,
            name: "Przysiady ze sztangą na plecach",
            muscleGroup: "Nogi / Czworogłowe",
            equipmentRequired: "Sztanga, Stojaki",
          },
          {
            id: 3,
            name: "Martwy ciąg klasyczny",
            muscleGroup: "Plecy / Tył ud",
            equipmentRequired: "Sztanga",
          },
          {
            id: 4,
            name: "Podciąganie na drążku nachwytem",
            muscleGroup: "Plecy / Najszerszy",
            equipmentRequired: "Drążek",
          },
          {
            id: 5,
            name: "Wyciskanie żołnierskie (OHP)",
            muscleGroup: "Barki",
            equipmentRequired: "Sztanga",
          },
          {
            id: 6,
            name: "Uginanie przedramion z hantlami",
            muscleGroup: "Biceps",
            equipmentRequired: "Hantle",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Stan ładowania */}
      {loading && (
        <div className="text-center text-gray-400 py-12 text-lg">
          Pobieranie ćwiczeń...
        </div>
      )}

      {/* Komunikat o błędzie z danymi zastępczymi */}
      {error && (
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded-xl text-center text-sm shadow-lg">
          ℹ️ Serwer backendu nie zwrócił danych (lub jest wyłączony). Wyświetlam
          przykładową bazę kafelków.
        </div>
      )}

      {/* Siatka kafelków (Grid) */}
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
                  {exercise.muscleGroup && (
                    <p className="flex items-center space-x-2">
                      <span className="text-gray-400">Partia:</span>
                      <span className="font-medium text-blue-300 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/50">
                        {exercise.muscleGroup}
                      </span>
                    </p>
                  )}
                  {exercise.equipmentRequired && (
                    <p className="text-gray-400">
                      <span className="text-gray-400 font-medium">Sprzęt:</span>{" "}
                      {exercise.equipmentRequired}
                    </p>
                  )}
                  {exercise.description && (
                    <p className="mt-3 text-gray-400 text-xs leading-relaxed line-clamp-3">
                      {exercise.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Dolny pasek kafelka */}
              <div className="mt-6 pt-4 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-500">
                <span>FitForge Database</span>
                <span className="text-blue-400 font-semibold cursor-pointer hover:underline">
                  Szczegóły &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
