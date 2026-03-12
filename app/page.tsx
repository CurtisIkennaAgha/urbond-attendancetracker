type RegisterCardProps = {
  name: string;
  lastUpdated: string;
};

function RegisterCard({ name, lastUpdated }: RegisterCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-[0_0_5px_rgba(0,0,0,0.2)] p-6 font-poppins w-full flex items-center justify-between">
      <div>
        <div className="text-xl font-semibold mb-2 text-black">{name}</div>
        <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
      </div>
      <svg className="w-8 h-8 text-gray-400 ml-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-black shadow p-8">
      <img src="/logo.jpg" alt="Logo" />
      <h1 className="text-2xl font-bold text-white">Attendance Tracker</h1>
    </header>
  );
}

export default function Home() {
  // Sample data
  const cards = [
    { name: "Session Name", lastUpdated: "April 27, 2024" },
    { name: "Another Session", lastUpdated: "March 12, 2026" },
    { name: "Third Session", lastUpdated: "February 10, 2026" },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white flex flex-col items-stretch justify-start p-4 gap-4">
        {cards.map((card, idx) => (
          <RegisterCard key={idx} name={card.name} lastUpdated={card.lastUpdated} />
        ))}
      </main>
    </>
  );
}
