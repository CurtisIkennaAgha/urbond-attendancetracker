"use client";
import { create } from "domain";
import { useState } from "react";

type RegisterCardProps = {
  name: string;
  lastUpdated: string;
};

function Registers({ cards }: { cards: RegisterCardProps[] }) {
  const sortedCards = [...cards].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
  return (
    <main className=" bg-white flex flex-col items-stretch justify-start p-4 gap-4">
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

function CreateSessionButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      className="bg-black text-white py-2 px-4 rounded flex justify-center mx-auto"
      onClick={onClick}
    >
      + Create Session
    </button>
  );
}

// Reusable Modal component
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-10">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[70vw] max-h-[90vh] relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  // 1. State for search input
  const [search, setSearch] = useState(""); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

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

  function createSession() {
    setModalContent(
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Create Session</h2>
        <form className="flex flex-col gap-4">
          <label className="text-gray-500 ">Session Name</label>
          <input
            type="text"
            className=" text-black w-full shadow-lg p-2 block bg-gray-100 mb-2"
          />
          <label className="text-gray-500 ">Initial Date</label>
          <input
            type="date"
            className=" text-black w-full shadow-lg p-2 block bg-gray-100 mb-2"
          />
          <label className="text-gray-500 ">Session Type</label>
          <select className=" text-black w-full shadow-lg p-2 block bg-gray-100 mb-2" defaultValue="">
            <option value="" disabled>Select session type</option>
            <option value="one-time">One Time Session</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button type="submit" className="bg-black text-white px-4 py-2 rounded">Save</button>
        </form>
      </div>
    );
    setIsModalOpen(true);
  }

  return (
    <>
      <Header search={search} setSearch={setSearch} />
      <Registers cards={sortedCards} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {modalContent}
      </Modal>
      <CreateSessionButton onClick={createSession} />
    </>
  );
}
