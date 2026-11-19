import { useState } from "react";
import GeneratorTab from "./components/GeneratorTab";
import HistoryTab from "./components/HistoryTab";
import ExercisesTab from "./components/ExercisesTab";
import StatsTab from "./components/StatsTab";
import SettingsTab from "./components/SettingsTab";

function App() {
  const [activeTab, setActiveTab] = useState<number>(1);

  const tabs = [
    { id: 1, name: "Ankieta" },
    { id: 2, name: "Zakładka 2 (Historia)" },
    { id: 3, name: "Baza ćwiczeń" },
    { id: 4, name: "Zakładka 4 (Statystyki)" },
    { id: 5, name: "Zakładka 5 (Ustawienia)" },
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 1:
        return <GeneratorTab />;
      case 2:
        return <HistoryTab />;
      case 3:
        return <ExercisesTab />;
      case 4:
        return <StatsTab />;
      case 5:
        return <SettingsTab />;
      default:
        return <GeneratorTab />;
    }
  };

  return (
    <div className="flex h-screen bg-green-900 text-white overflow-hidden">
      <aside className="w-72 bg-black flex flex-col justify-start pt-12 px-4 space-y-3 shadow-2xl shrink-0">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-green-400 h-80">
            Kocham kaucje
          </h1>
        </div>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full py-3 px-4 rounded-4xl font-bold text-center transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-green-600 text-white shadow-lg translate-x-1"
                : "bg-green-700/40 text-gray-300 hover:bg-green-700 hover:text-white"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </aside>

      <main className="flex-1 overflow-y-auto p-10 flex items-center justify-center bg-black">
        {renderActiveComponent()}
      </main>
    </div>
  );
}

export default App;
