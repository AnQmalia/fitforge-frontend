import { useState } from "react";
import GeneratorTab from "./components/GeneratorTab";
import HistoryTab from "./components/HistoryTab";
import ExercisesTab from "./components/ExercisesTab";
import CalorieTab from "./components/CalorieTab";
import WorkoutPlanTab from "./components/WorkoutPlanTab";

function App() {
  const [activeTab, setActiveTab] = useState<number>(1);

  const tabs = [
    { id: 1, name: "Ankieta" },
    { id: 2, name: "Historia" },
    { id: 3, name: "Baza ćwiczeń" },
    { id: 4, name: "Kalkulator kalorii" },
    { id: 5, name: "Plan treningowy" },
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
        return <CalorieTab />;
      case 5:
        return <WorkoutPlanTab />;
      default:
        return <GeneratorTab />;
    }
  };

  return (
    <div className="flex h-screen bg-canvas text-white overflow-hidden">
      <aside className="w-64 bg-sidebar border-r border-line flex flex-col px-4 py-8 shrink-0">
        <div className="px-3 mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-mint">FitForge</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-white">.NET Projekt</h1>
        </div>

        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-mint/15 text-mint"
                  : "text-muted hover:bg-surface hover:text-white"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-canvas">
        <div className="min-h-full w-full flex flex-col items-center justify-center px-6 py-8 md:px-10">
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
}

export default App;
