"use client";
import { useState, useEffect } from "react";
import { supabase } from '../utils/supabaseClient';
// Supabase connection test component
function SupabaseTest() {
  useEffect(() => {
    supabase.auth.getSession()
      .then(result => {
        console.log('Supabase connection test:', result);
      })
      .catch(error => {
        console.log('Supabase connection error:', error);
      });
  }, []);
  return null;
}

type RegisterCardProps = {
  id: string;
  name: string;
  lastUpdated: string;
};

function Registers({ cards, loading, error }: { cards: RegisterCardProps[]; loading: boolean; error: string | null }) {
  const sortedCards = [...cards].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
  if (loading) {
    return <div className="p-4 text-gray-500">Loading sessions...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }
  return (
    <main className=" bg-white flex flex-col items-stretch justify-start p-4 gap-4">
      {sortedCards.map((card, idx) => (
        <RegisterCard key={card.id} id={card.id} name={card.name} lastUpdated={card.lastUpdated} />
      ))}
    </main>
  );
}

function RegisterCard({ id, name, lastUpdated }: RegisterCardProps) {
  return (
    <a
      href={`/${encodeURIComponent(name)}`}
      className="bg-white rounded-lg shadow-[0_0_5px_rgba(0,0,0,0.2)] p-6 font-poppins w-full flex items-center justify-between hover:bg-gray-100 transition cursor-pointer"
      style={{ textDecoration: 'none' }}
    >
      <div>
        <div className="text-xl font-semibold mb-2 text-black">{name}</div>
        <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
      </div>
      <svg className="w-8 h-8 text-gray-400 ml-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

function Header({ search, setSearch }: { search: string; setSearch: (value: string) => void }) {
  return (
    <header className="bg-black shadow p-3 h-20 flex items-center gap-4">
      <img src="/logo.jpg" alt="Logo" className="w-12 sm:w-16 md:w-20 object-contain" />
      <h1 className="font-bold text-white text-lg sm:text-xl md:text-2xl">Attendance Tracker</h1>
      <input
        type="text"
        placeholder="Search sessions..."
        className="px-3 py-2 rounded bg-white text-black focus:outline-none flex-1 max-w-xs sm:max-w-sm md:max-w-md"
        value={search ?? ""}
        onChange={e => setSearch(e.target.value)}
      />
    </header>
  );
}

function CreateSessionButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      className="bg-black text-white py-2 px-4 rounded flex justify-center mt-5 mx-auto"
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
  const [search, setSearch] = useState(""); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [cards, setCards] = useState<RegisterCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      const { data, error } = await supabase
        .from('Sessions')
        .select('id, name, last_updated');
      if (error) {
        setError(error.message);
        setCards([]);
      } else {
        console.log('Sessions table contents:', data);
        setCards(
          (data ?? []).map((row: any) => ({
            id: row.id,
            name: row.name,
            lastUpdated: new Date(row.last_updated).toLocaleDateString(),
          }))
        );
        setError(null);
      }
      setLoading(false);
    }
    fetchSessions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Sessions' },
        payload => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter cards based on search
  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(search.toLowerCase())
  );

  // Order cards by match to search 
  const cardsWithMatchIndex = filteredCards.map(card => ({
    ...card,
    matchIndex: card.name.toLowerCase().indexOf(search.toLowerCase())
  }));

  // Sort cards by match index
  const sortedCards = cardsWithMatchIndex.sort((a, b) => a.matchIndex - b.matchIndex);

  function createSessionModal() {
    setModalContent(
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Create Session</h2>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target;
            const name = form.sessionName.value;
            const initialDate = form.initialDate.value;
            const sessionType = form.sessionType.value;
            // Use initialDate as last_updated for now
            const { data, error } = await supabase
              .from('Sessions')
              .insert([
                {
                  name,
                  last_updated: initialDate ? initialDate + 'T00:00:00+00' : null,
                  session_type: sessionType
                }
              ]);
            setIsModalOpen(false);
          }}
        >
          <label className="text-gray-500 ">Session Name</label>
          <input
            name="sessionName"
            type="text"
            className=" text-black w-full shadow-lg p-2 block bg-gray-100 mb-2"
            required
          />
          <label className="text-gray-500 ">Initial Date</label>
          <input
            name="initialDate"
            type="date"
            className=" text-black w-full shadow-lg p-2 block bg-gray-100 mb-2"
            required
          />
          <label className="text-gray-500 ">Session Type</label>
          <select
            name="sessionType"
            className=" text-black w-full shadow-lg p-2 block bg-gray-100 mb-2"
            defaultValue=""
            required
          >
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

  // ...existing code...

  return (
    <>
      <SupabaseTest />
      <Header search={search} setSearch={setSearch} />
      <CreateSessionButton onClick={createSessionModal} />
      <Registers cards={sortedCards} loading={loading} error={error} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>{modalContent}</Modal>
    </>
  );
}
