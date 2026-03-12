"use client";
import { useState } from "react";

type RegisterCardProps = {
  name: string;
  lastUpdated: string;
};

function registers(cards: RegisterCardProps[]) {
    const sortedCards = [...cards].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
  return (
    <main className="min-h-screen bg-white flex flex-col items-stretch justify-start p-4 gap-4">
      {sortedCards.map((card, idx) => (
        <RegisterCard key={idx} name={card.name} lastUpdated={card.lastUpdated} />
      ))}
    </main>
  );
}

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

function Header({ search, setSearch }: { search: string; setSearch: (value: string) => void }) {
  return (
    <header className="bg-black shadow p-3 h-20 flex items-center">
      <img src="/logo.jpg" alt="Logo" className=" w-45 object-contain" />
      <h1 className="text-xl font-bold text-white">Attendance Tracker</h1>
      <input
        type="text"
        placeholder="Search sessions..."
        className="ml-auto px-3 py-2 rounded bg-white text-black focus:outline-none"
        value={search ?? ""}
        onChange={e => setSearch(e.target.value)}
      />
    </header>
  );
}

export default function Home() {
  // 1. State for search input
  const [search, setSearch] = useState(""); 

  // Sample data
  const cards = [
    { name: "Session Name", lastUpdated: "April 27, 2024" },
    { name: "Another Session", lastUpdated: "March 12, 2026" },
    { name: "Third Session", lastUpdated: "February 10, 2026" },
  ];

  // 2. Filter cards based on search
  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(search.toLowerCase())
  );

  // 3 Order cards by match to search 
  const cardsWithMatchIndex = filteredCards.map(card => ({
  ...card,
  matchIndex: card.name.toLowerCase().indexOf(search.toLowerCase())
  }));

  // 4. Sort cards by match index
  const sortedCards = cardsWithMatchIndex.sort((a, b) => a.matchIndex - b.matchIndex);

 return (
    <>
      <Header search={search} setSearch={setSearch} />
      {registers(sortedCards)}
    </>
  );
}
