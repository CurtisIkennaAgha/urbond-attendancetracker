
"use client";
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface SessionHeaderProps {
  sessionId: string;
  sessionName: string;
  registerDate: string;
  setRegisterDate: (v: string) => void;
}

// Modal with close handler
function RemoveAttendeeModal({ onClose, onRemove, title }: { onClose: () => void, onRemove: () => void, title?: string }) {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center pointer-events-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-600">{title || 'Are you sure you want to remove this attendee?'}</h2>
        <div className="flex justify-center gap-4 mt-6">
          <button className="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-red-300 text-gray-600 rounded hover:bg-red-600" onClick={onRemove}>Remove</button>
        </div>
      </div>
    </div>
  );
}

function SessionHeader({ sessionId, sessionName, registerDate, setRegisterDate }: SessionHeaderProps) {
  // Helper to change date by delta days
  function changeDateBy(delta: number) {
    const date = new Date(registerDate);
    date.setDate(date.getDate() + delta);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setRegisterDate(`${yyyy}-${mm}-${dd}`);
  }
  return (
    <header className="bg-white mb-6 "> 
      <h1 className="text-2xl text-gray-950 font-bold">Session: {sessionName}</h1>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-gray-600 mb-0">Session Date:</p>
        <button
          type="button"
          aria-label="Previous day"
          className="px-2 py-1 text-lg text-gray-600 hover:text-black"
          onClick={() => changeDateBy(-1)}
        >&#8592;</button>
        <input
          name="RegisterDate"
          type="date"
          value={registerDate}
          onChange={e => setRegisterDate(e.target.value)}
          className="text-black w-35 shadow-lg p-2 bg-gray-100"
          required
        />
        <button
          type="button"
          aria-label="Next day"
          className="px-2 py-1 text-lg text-gray-600 hover:text-black"
          onClick={() => changeDateBy(1)}
        >&#8594;</button>
      </div>

    </header>
  );
}

function RegisterSlot({ index, name, age, checked, editable = false, onNameChange, onAgeChange, onCheckedChange }: {
  index: number,
  name: string,
  age: string | number,
  checked: boolean,
  editable?: boolean,
  onNameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onAgeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onCheckedChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
}) {
  // Always provide onChange for controlled inputs, but only set readOnly for text fields if not editable.
  // For checkboxes, allow toggling if onCheckedChange is provided.
  // Always provide a function for onChange to silence React warning
  const noop = () => {};
  const safeOnNameChange = onNameChange || noop;
  const safeOnAgeChange = onAgeChange || noop;
  return (
    <div className="bg-white shadow p-4 mb-6 text-black flex items-center gap-4">
      <p className="text-lg text-gray-400 mb-0">{index + 1}</p>
      <input
        type="text"
        value={name}
        onChange={editable ? safeOnNameChange : noop}
        readOnly={!editable}
        className="border p-2 max-w-[50%] mr-1 bg-gray-100"
      />
      <input
        type="text"
        value={age}
        onChange={editable ? safeOnAgeChange : noop}
        readOnly={!editable}
        className="border p-2 w-auto max-w-[15%] mr-1 bg-gray-100"
      />
      <input
        type="checkbox"
        checked={checked}
        onChange={onCheckedChange || noop}
        className="border rounded-lg mr-2 w-8 h-5 min-w-8 min-h-5"
      />
    </div>
  );
}

async function fetchRegisters(sessionId: string, date: string) {
  const { data: attendance, error } = await supabase
    .from('attendance')
    .select('attendee_id')
    .eq('session_id', sessionId)
    .eq('attended_at', date);
  if (error || !attendance) return [];
  const attendeeIds = attendance.map(a => a.attendee_id);
  const { data: attendees, error: attendeesError } = await supabase
    .from('attendees')
    .select('id, name, age')
    .in('id', attendeeIds);
  if (attendeesError || !attendees) return [];
  return attendance.map(a => {
    const attendee = attendees.find(at => at.id === a.attendee_id);
    return { name: attendee?.name, age: attendee?.age };
  });

}

export default function SessionPage() {
            // const router = useRouter(); // Removed duplicate
          const router = useRouter();
        // Modal for session removal
        const [showSessionRemoveModal, setShowSessionRemoveModal] = useState(false);
      // ...existing code...
      const [registers, setRegisters] = useState<{ name: string, age: string | number }[]>([]);

  // --- Checkbox state for all register slots ---
  // HINT: This state tracks the checked state for each register slot (existing attendees)
  const [checkedStates, setCheckedStates] = useState<boolean[]>([]);
  // Modal state: index of attendee being removed, or null
  const [removingAttendeeIdx, setRemovingAttendeeIdx] = useState<number | null>(null);
  // Track if removal is in progress
  const [removing, setRemoving] = useState(false);

      // HINT: Sync checkedStates with registers length whenever registers change
      useEffect(() => {
        setCheckedStates(registers.map(() => true));
      }, [registers]);
    // Save new registration to database
    async function handleNewRegisterSave(checked: boolean) {
      console.log('handleNewRegisterSave called', { sessionId, registerDate, newName, newAge, checked });
      if (!sessionId || !registerDate || !newName || !newAge || !checked) return;
      // 1. Find or create attendee
      let attendeeId = null;
      const trimmedName = newName.trim();
      const ageNumber = Number(newAge);
      if (isNaN(ageNumber)) {
        alert('Age must be a number.');
        return;
      }
      // Try to find attendee by name and age
      const { data: foundAttendee } = await supabase
        .from('attendees')
        .select('id')
        .eq('name', trimmedName)
        .eq('age', ageNumber)
        .single();
      console.log('foundAttendee', foundAttendee);
      if (foundAttendee && foundAttendee.id) {
        attendeeId = foundAttendee.id;
      } else {
        // Create new attendee
        const { data: newAttendee, error: newAttendeeError } = await supabase
          .from('attendees')
          .insert([{ name: trimmedName, age: ageNumber }])
          .select('id')
          .single();
        console.log('newAttendee', newAttendee, newAttendeeError);
        if (newAttendee && newAttendee.id) {
          attendeeId = newAttendee.id;
        } else {
          alert('Could not create attendee.');
          return;
        }
      }
      // 2. Insert attendance record
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert([
          {
            session_id: sessionId,
            attendee_id: attendeeId,
            attended_at: registerDate,
          },
        ]);
      console.log('attendance insert error', attendanceError);
      if (attendanceError) {
        alert('Could not save attendance.');
        return;
      }
      // 3. Clear the new slot and refresh
      setNewName("");
      setNewAge("");
      setNewChecked(false);
      // Re-fetch registers
      const registers = await fetchRegisters(sessionId, registerDate);
      setRegisters(registers);
    }
  // State for the new (empty) register slot
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newChecked, setNewChecked] = useState(false);
  // State for the register date
  const [registerDate, setRegisterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
    function renderRegisterSlots() {
      // Handler to toggle checkbox for existing registers
      // HINT: This toggles the checked state for a specific attendee row
    const handleToggle = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log(`Checkbox at index ${idx} changed to`, e.target.checked);
      if (!e.target.checked) {
        setRemovingAttendeeIdx(idx);
      } else {
        setCheckedStates(prev => {
          const copy = [...prev];
          copy[idx] = true;
          return copy;
        });
      }
    };

      return (
        <>
          {registers.map((reg, idx) => (
            <RegisterSlot
              key={idx}
              index={idx}
              name={reg.name}
              age={reg.age}
              checked={checkedStates[idx] ?? true}
              editable={true}
              onCheckedChange={handleToggle(idx)}
            />
          ))}
          <RegisterSlot
            index={registers.length}
            name={newName}
            age={newAge}
            checked={newChecked}
            editable={true}
            onNameChange={e => setNewName(e.target.value)}
            onAgeChange={e => setNewAge(e.target.value)}
            onCheckedChange={async e => {
              const checked = e.target.checked;
              setNewChecked(checked);
              if (checked) {
                await handleNewRegisterSave(true);
              }
            }}
          />
        </>
      );
    }
  const params = useParams();
  let sessionNameParam = params?.name;
  if (Array.isArray(sessionNameParam)) {
    sessionNameParam = sessionNameParam[0] || "";
  }
  const sessionName = decodeURIComponent(sessionNameParam || "");
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ...registers state is already declared above, remove this duplicate...

  useEffect(() => {
    async function fetchSessionIdAndRegisters() {
      setLoading(true);
      console.log('Session name for fetch:', sessionName);
      const { data, error } = await supabase
        .from('Sessions')
        .select('id')
        .eq('name', sessionName)
        .single();
      if (error) {
        setError(error.message);
        setSessionId("");
        setLoading(false);
        return;
      }
      const id = data?.id || "";
      setSessionId(id);
      setError(null);
      // Use the selected registerDate if set, otherwise don't fetch
      if (registerDate) {
        const registers = await fetchRegisters(id, registerDate);
        setRegisters(registers);
      } else {
        setRegisters([]);
      }
      setLoading(false);
    }
    if (sessionName) fetchSessionIdAndRegisters();
  }, [sessionName, registerDate]);

  return (
    <div className="p-8 relative min-h-screen">
      <button
        className="fixed bottom-4 left-4 text-gray-700 hover:underline hover:text-black bg-transparent border-none shadow-none p-0 m-0 text-lg flex items-center z-50"
        style={{ background: 'none', border: 'none' }}
        onClick={() => router.back()}
      >
        <span className="mr-1">&#8592;</span> Go Back
      </button>
      {removingAttendeeIdx !== null && (
        <RemoveAttendeeModal
          onClose={() => {
            // Restore the checkbox to checked when modal closes
            setCheckedStates(prev => {
              const copy = [...prev];
              copy[removingAttendeeIdx] = true;
              return copy;
            });
            setRemovingAttendeeIdx(null);
          }}
          onRemove={async () => {
            if (removing) return;
            setRemoving(true);
            // Remove from DB: need sessionId, registerDate, attendeeId
            const reg = registers[removingAttendeeIdx];
            // Find attendeeId by name and age
            const { data: attendee } = await supabase
              .from('attendees')
              .select('id')
              .eq('name', reg.name)
              .eq('age', reg.age)
              .single();
            if (attendee && attendee.id) {
              await supabase
                .from('attendance')
                .delete()
                .eq('session_id', sessionId)
                .eq('attendee_id', attendee.id)
                .eq('attended_at', registerDate);
            }
            // Remove from UI
            setRegisters(prev => prev.filter((_, idx) => idx !== removingAttendeeIdx));
            setCheckedStates(prev => prev.filter((_, idx) => idx !== removingAttendeeIdx));
            setRemovingAttendeeIdx(null);
            setRemoving(false);
          }}
        />
      )}
      <SessionHeader
        sessionId={sessionId}
        sessionName={sessionName}
        registerDate={registerDate}
        setRegisterDate={setRegisterDate}
      />
      <div className="flex items-center gap-2 mb-2">
        <button className="px-3 py-1.5 bg-blue-400 text-gray-800 rounded">View Data</button>
        <button className="px-3 py-1.5 bg-red-400 text-gray-800 rounded" onClick={() => setShowSessionRemoveModal(true)}>Remove</button>
      </div>
            {showSessionRemoveModal && (
              <RemoveAttendeeModal
                onClose={() => setShowSessionRemoveModal(false)}
                onRemove={async () => {
                  // Remove all attendance records for this session
                  await supabase
                    .from('attendance')
                    .delete()
                    .eq('session_id', sessionId);
                  // Remove the session itself
                  await supabase
                    .from('Sessions')
                    .delete()
                    .eq('id', sessionId);
                  // Clear UI
                  setRegisters([]);
                  setCheckedStates([]);
                  setSessionId("");
                  setShowSessionRemoveModal(false);
                  // Redirect to main page
                  router.push('/');
                }}
                title="Are you sure you want to remove this session?"
              />
            )}
      {loading ? (
        <p>Loading session details...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <>
          <h1 className="text-2xl text-gray-950 font-bold mb-4">Session Details</h1>
          {renderRegisterSlots()}
        </>
      )}
    </div>
  );
}
