import RoadmapView from "@/components/RoadmapView";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">Backend Engineering Roadmap</h1>
            <p className="text-xs text-gray-400">
              5 phases · 12 projects · 100+ topics · 24 weeks
            </p>
          </div>
        </div>
      </header>
      <main className="pt-6">
        <RoadmapView />
      </main>
    </div>
  );
}
