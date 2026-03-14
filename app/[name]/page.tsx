"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface SessionHeaderProps {
  sessionId: string;
  sessionName: string;
  registerDate: string;
  setRegisterDate: (v: string) => void;
}

function SessionHeader({ sessionId, sessionName, registerDate, setRegisterDate }: SessionHeaderProps) {
  return (
    <header className="bg-white mb-6 "> 
      <h1 className="text-2xl text-gray-950 font-bold">Session: {sessionName}</h1>
      <p className="text-gray-600">Session ID: {sessionId}</p>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-gray-600 mb-0">Session Date:</p>
        <input
          name="RegisterDate"
          type="date"
          value={registerDate}
          onChange={e => setRegisterDate(e.target.value)}
          className="text-black w-30 shadow-lg p-2 bg-gray-100"
          required
        />
      </div>
      <p className="text-gray-600">Session Location: idk yet</p>
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
  return (
    <div className="bg-white shadow p-4 mb-6 text-black flex items-center gap-4">
      <p className="text-lg text-gray-400 mb-0">{index + 1}</p>
      <input
        type="text"
        value={name}
        readOnly={!editable}
        onChange={editable ? onNameChange : undefined}
        className="border p-2 max-w-[50%] mr-1 bg-gray-100"
      />
      <input
        type="text"
        value={age}
        readOnly={!editable}
        onChange={editable ? onAgeChange : undefined}
        className="border p-2 w-auto max-w-[15%] mr-1 bg-gray-100"
      />
      <input
        type="checkbox"
        checked={checked}
        readOnly={!editable}
        onChange={editable ? onCheckedChange : undefined}
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
    // Save new registration to database
    async function handleNewRegisterSave(checked: boolean) {
      console.log('handleNewRegisterSave called', { sessionId, registerDate, newName, newAge, checked });
      if (!sessionId || !registerDate || !newName || !newAge || !checked) return;
      // 1. Find or create attendee
      let attendeeId = null;
      const ageNumber = Number(newAge);
      if (isNaN(ageNumber)) {
        alert('Age must be a number.');
        return;
      }
      // Try to find attendee by name and age
      const { data: foundAttendee } = await supabase
        .from('attendees')
        .select('id')
        .eq('name', newName)
        .eq('age', ageNumber)
        .single();
      console.log('foundAttendee', foundAttendee);
      if (foundAttendee && foundAttendee.id) {
        attendeeId = foundAttendee.id;
      } else {
        // Create new attendee
        const { data: newAttendee, error: newAttendeeError } = await supabase
          .from('attendees')
          .insert([{ name: newName, age: ageNumber }])
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
      return (
        <>
          {registers.map((reg, idx) => (
            <RegisterSlot key={idx} index={idx} name={reg.name} age={reg.age} checked={true} />
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
              console.log('Checkbox changed', e.target.checked, { newName, newAge });
              setNewChecked(e.target.checked);
              if (e.target.checked && newName && newAge) {
                await handleNewRegisterSave(e.target.checked);
              }
            }}
          />
        </>
      );
    }
  const params = useParams();
  const sessionName = decodeURIComponent(params?.name || "");
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registers, setRegisters] = useState<{ name: string, age: string | number }[]>([]);

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
    <div className="p-8">
      <SessionHeader
        sessionId={sessionId}
        sessionName={sessionName}
        registerDate={registerDate}
        setRegisterDate={setRegisterDate}
      />
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
