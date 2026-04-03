"use client";
import { useState, useEffect } from "react";

// Inline NeedHelpModal (copied from [name]/page.tsx, but without session-specific logic)
function NeedHelpModal({ onClose }: { onClose: () => void }) {
  // Device detection: true if mobile, false if desktop
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(window.navigator.userAgent);
  const videoSrc = isMobile ? '/mobilerecording.mp4' : '/desktoprecording.mp4';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-auto text-left flex flex-col justify-start relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          aria-label="Close"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-4 text-gray-800 text-center">How to Use the Attendance Tracker</h2>
        <div className="mb-6">
          <video controls className="mx-auto rounded shadow max-w-full max-h-[40vh]">
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <ol className="list-decimal pl-5 mb-4 text-gray-700 space-y-2 text-sm">
          <li><b>View Sessions:</b> Select or search for a session to view its details and attendees.</li>
          <li><b>Change Session Date:</b> Use the arrows or date picker to switch between different session dates.</li>
          <li><b>Add Attendee:</b> Enter the attendee's name and age in the empty row at the bottom, then check the box to add them to the session.</li>
          <li><b>Edit Attendee:</b> Modify the name or age directly in the list if needed.</li>
          <li><b>Remove Attendee:</b> Uncheck the box next to an attendee to remove them from the session.</li>
          <li><b>Edit Session Name:</b> Click the <span className="inline-block px-2 py-1 bg-gray-300 rounded text-xs">Edit</span> button to rename the session.</li>
          <li><b>Delete Session:</b> Click the <span className="inline-block px-2 py-1 bg-gray-300 rounded text-xs">Remove</span> button to delete the session and all its data.</li>
          <li><b>View Data:</b> Use the <span className="inline-block px-2 py-1 bg-gray-300 rounded text-xs">View Data</span> button to see session data and analytics.</li>
          <li><b>Go Back:</b> Use the <span className="inline-block px-2 py-1 bg-gray-200 rounded text-xs">Go Back</span> button at the bottom left to return to the previous page.</li>
        </ol>
        <div className="mb-4 text-gray-600 text-sm text-center">If you need more help, contact your administrator.</div>
        <div className="flex justify-center">
          <button
            className="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
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
  const [lastUpdatedMap, setLastUpdatedMap] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    async function fetchAllLastUpdated() {
      const updates: Record<string, string | undefined> = {};
      for (const card of cards) {
        const { data: attendance } = await supabase
          .from('attendance')
          .select('attended_at')
          .eq('session_id', card.id);
        if (attendance && attendance.length > 0) {
          const dates = attendance.map((a: any) => new Date(a.attended_at));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
          // Format as dd/mm/yyyy
          const day = String(maxDate.getDate()).padStart(2, '0');
          const month = String(maxDate.getMonth() + 1).padStart(2, '0');
          const year = maxDate.getFullYear();
          updates[card.id] = `${day}/${month}/${year}`;
        } else {
          updates[card.id] = undefined;
        }
      }
      setLastUpdatedMap(updates);
    }
    if (cards.length > 0) fetchAllLastUpdated();
  }, [cards]);

  if (loading) {
    return <div className="p-4 text-gray-500">Loading sessions...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }
  return (
    <main className=" bg-white flex flex-col items-stretch justify-start p-4 gap-4">
      {cards.map((card, idx) => (
        <RegisterCard
          key={card.id}
          id={card.id}
          name={card.name}
          lastUpdated={lastUpdatedMap[card.id] ?? ""}
        />
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
        <p className="text-sm text-gray-500">Last updated: {lastUpdated ? lastUpdated : 'No attendance yet'}</p>
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
        className="px-2 py-2 rounded bg-white text-black focus:outline-none w-full max-w-xs sm:max-w-sm md:max-w-md flex-1 min-w-0"
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
  const [showHelpModal, setShowHelpModal] = useState(false);
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
            const frequency = form.sessionFrequency.value;
            // Use initialDate as last_updated for now
            const { data, error } = await supabase
              .from('Sessions')
              .insert([
                {
                  name,
                  last_updated: initialDate ? initialDate + 'T00:00:00+00' : null,
                  frequency,
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
          <label className="text-gray-500 ">Session Frequency</label>
          <select
            name="sessionFrequency"
            className="text-black w-full shadow-lg p-2 block bg-gray-100 mb-2"
            defaultValue="one-off"
            required
          >
            <option value="one-off">One-off</option>
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
      {/* Floating Help Button */}
      <button
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gray-400 text-white flex items-center justify-center shadow-lg  focus:outline-none"
        title="Need Help?"
        aria-label="Open help modal"
        onClick={() => setShowHelpModal(true)}
      >?
      </button>
      {showHelpModal && <NeedHelpModal onClose={() => setShowHelpModal(false)} />}
    </>
  );
}
