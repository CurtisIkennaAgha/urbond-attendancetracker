
"use client";
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// Simple empty modal for Need Help
function NeedHelpModal({ onClose }: { onClose: () => void }) {
  // Device detection: true if mobile, false if desktop
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(window.navigator.userAgent);
  const videoSrc = isMobile ? '/mobilerecording.mp4' : '/desktoprecording.mp4';
  const videoLabel = isMobile ? 'Mobile Walkthrough' : 'Desktop Walkthrough';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30">
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
          <li><b>Edit Attendee:</b> Modify the name or age directly in the list if needed. <span className="text-xs text-gray-500">(When editing an auto-filled register, all visible attendees are saved for that date.)</span></li>
          <li><b>Remove Attendee:</b> Uncheck the box next to an attendee to remove them from the session.</li>
          <li><b>Clear Register:</b> Click the <span className="inline-block px-2 py-1 bg-gray-300 rounded text-xs">Clear</span> button to remove all attendance for the current session and date.</li>
          <li><b>No Session on Date:</b> If there is no session on a date, check the box under the auto-filled message to keep the register empty and prevent auto-fill for that date. Uncheck to restore auto-fill.</li>
          <li><b>Edit Session Name:</b> Click the <span className="inline-block px-2 py-1 bg-gray-300 rounded text-xs">Edit</span> button to rename the session.</li>
          <li><b>Delete Session:</b> Open the <span className="inline-block px-2 py-1 bg-gray-300 rounded text-xs">Edit</span> modal, then click the <span className="inline-block px-2 py-1 bg-gray-300 rounded text-xs">Delete this session</span> link below the fields to delete the session and all its data.</li>
          <li><b>View Data:</b> Use the <span className="inline-block px-2 py-1 bg-gray-300 rounded text-xs">View Data</span> button to see session data and analytics.</li>
          <li><b>Download Data:</b> Download buttons for each table are now located <b>underneath</b> the table titles, not next to them. Choose your format and click Download.</li>
          <li><b>Go Back:</b> Use the <span className="inline-block px-2 py-1 bg-gray-200 rounded text-xs">Go Back</span> button at the <b>top left</b> of the page to return to the previous page.</li>
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
import { supabase } from '../../utils/supabaseClient';

interface SessionHeaderProps {
  sessionId: string;
  sessionName: string;
  registerDate: string;
  setRegisterDate: (v: string) => void;
  frequency: string; // "weekly" | "one-off" | "monthly"
}

// Modal with close handler
function RemoveAttendeeModal({ onClose, onRemove, title }: { onClose: () => void, onRemove: () => void, title?: string }) {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center pointer-events-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title || 'Are you sure you want to remove this attendee?'}</h2>
        <div className="flex justify-center gap-4 mt-6">
          <button className="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-red-400 text-gray-800 rounded hover:bg-red-600" onClick={onRemove}>Remove</button>
        </div>
      </div>
    </div>
  );
}

function SessionHeader({ sessionId, sessionName, registerDate, setRegisterDate, frequency }: SessionHeaderProps) {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  useEffect(() => {
    async function fetchLastUpdated() {
      if (!sessionId) return;
      const { data: attendance } = await supabase
        .from('attendance')
        .select('attended_at')
        .eq('session_id', sessionId);
      if (attendance && attendance.length > 0) {
        const dates = attendance.map((a: any) => new Date(a.attended_at));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const day = String(maxDate.getDate()).padStart(2, '0');
        const month = String(maxDate.getMonth() + 1).padStart(2, '0');
        const year = maxDate.getFullYear();
        setLastUpdated(`${day}/${month}/${year}`);
      } else {
        setLastUpdated("");
      }
    }
    fetchLastUpdated();
  }, [sessionId]);
  // Helper to change date by frequency
  function changeDateBy(direction: number) {
    const date = new Date(registerDate);
    if (frequency === "weekly") {
      date.setDate(date.getDate() + 7 * direction);
    } else if (frequency === "monthly") {
      const d = date.getDate();
      date.setMonth(date.getMonth() + direction);
      // Try to preserve day if possible (e.g., 31st to 30th/28th)
      if (date.getDate() < d) {
        date.setDate(0); // Go to last day of previous month
      }
    } else {
      date.setDate(date.getDate() + direction);
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setRegisterDate(`${yyyy}-${mm}-${dd}`);
  }
  // Share button handler
  function handleShare() {
    const dateStr = registerDate;
    const url = typeof window !== 'undefined' ? window.location.origin + `/${encodeURIComponent(sessionName)}?date=${dateStr}` : '';
    const msg = `I updated the attendance register for ${sessionName} on ${dateStr}, click here to look: ${url}`;
    if (navigator.share) {
      navigator.share({
        title: `Attendance Register: ${sessionName}`,
        text: msg,
        url
      });
    } else {
      alert('Sharing is not supported on this device/browser.');
    }
  }
  return (
    <header className="bg-white mb-3 "> 
      <h1 className="text-2xl text-gray-950 font-bold">Session: {sessionName}</h1>
      <div className="flex items-center gap-2 ">{/* mb-1 instead of mb-2 to halve the gap */}
        <p className="text-gray-600 mb-0"> Date:</p>
        <button
          type="button"
          aria-label={`Previous ${frequency === "weekly" ? "week" : frequency === "monthly" ? "month" : "day"}`}
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
          aria-label={`Next ${frequency === "weekly" ? "week" : frequency === "monthly" ? "month" : "day"}`}
          className="px-2 py-1 text-lg text-gray-600 hover:text-black"
          onClick={() => changeDateBy(1)}
        >&#8594;</button>
      </div>
      <div className="mt-1 text-sm text-gray-500 flex gap-6 items-center">
        <span>
          Frequency: <b>{frequency.charAt(0).toUpperCase() + frequency.slice(1)}</b>
        </span>
        <span>
          Last updated: <b>{lastUpdated ? lastUpdated : 'No attendance yet'}</b>
        </span>
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

// Enhanced: If no attendance for this date, auto-populate with all previous attendees for this session
async function fetchRegisters(sessionId: string, date: string) {
  // 1. Check if there is any attendance for this session and date
  const { data: attendance, error } = await supabase
    .from('attendance')
    .select('attendee_id')
    .eq('session_id', sessionId)
    .eq('attended_at', date);
  if (error) return [];
  if (attendance && attendance.length > 0) {
    // There is attendance for this date, fetch attendee details as before
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
  } else {
    // No attendance for this date: fetch all unique previous attendees for this session
    const { data: allAttendance, error: allError } = await supabase
      .from('attendance')
      .select('attendee_id')
      .eq('session_id', sessionId);
    if (allError || !allAttendance || allAttendance.length === 0) return [];
    // Get unique attendee IDs
    const uniqueIds = Array.from(new Set(allAttendance.map(a => a.attendee_id)));
    if (uniqueIds.length === 0) return [];
    // Fetch attendee details
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('id, name, age')
      .in('id', uniqueIds);
    if (attendeesError || !attendees) return [];
    // Return all previous attendees for this session
    return attendees.map(a => ({ name: a.name, age: a.age }));
  }
}

export default function SessionPage() {
  const searchParams = useSearchParams();
  // Frequency state for the session
  const [frequency, setFrequency] = useState<string>("one-off");
  // Track if user marks 'no session' for this date
  const [noSession, setNoSession] = useState(false);
  // Track if the register was edited (for auto-filled new dates)
  const [registerEdited, setRegisterEdited] = useState(false);
  // Track if auto-filled rows have been saved for this date
  const [autoFillSaved, setAutoFillSaved] = useState(false);
  // State for editing session name and frequency in modal
  const [editSessionName, setEditSessionName] = useState("");
  const [editFrequency, setEditFrequency] = useState<string>("one-off");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Save handler for session name
  async function handleSaveSessionName() {
    if (!editSessionName.trim() || !sessionId) return;
    setEditLoading(true);
    setEditError("");
    try {
      // Update session name and frequency in Supabase
      const result = await supabase
        .from('Sessions')
        .update({ name: editSessionName.trim(), frequency: editFrequency })
        .eq('id', sessionId);
      const { error } = result;
      if (error) {
        setEditError(error.message || 'Failed to update session.');
        setEditLoading(false);
        return;
      }
      setShowSessionEditModal(false);
      setEditLoading(false);
      setEditError("");
      if (editSessionName !== sessionName) {
        router.replace(`/${encodeURIComponent(editSessionName)}`);
      }
      setFrequency(editFrequency); // update frequency in main state
    } catch (e) {
      setEditError('Unexpected error.');
      setEditLoading(false);
      console.error('Unexpected error in handleSaveSessionName:', e);
    }
  }
  // const router = useRouter(); // Removed duplicate
  const router = useRouter();
  // Modal for session removal
  const [showSessionRemoveModal, setShowSessionRemoveModal] = useState(false);
  // Modal for session edit
  const [showSessionEditModal, setShowSessionEditModal] = useState(false);
  // Modal for Need Help
  const [showNeedHelpModal, setShowNeedHelpModal] = useState(false);
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
    // Check for ?date=YYYY-MM-DD in the URL
    const dateParam = searchParams?.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
    function renderRegisterSlots() {
      // Handler to toggle checkbox for existing registers

      // Save or update attendance for an existing attendee
      // Helper to upsert all current visible auto-filled rows to the DB
      async function saveAllAutoFilledRows() {
        if (!sessionId || !registerDate) return;
        // Only upsert for rows that are checked (present in UI)
        const upsertRows = [];
        for (let i = 0; i < registers.length; i++) {
          const reg = registers[i];
          const name = reg.name?.toString().trim();
          const ageNumber = Number(reg.age);
          if (!name || isNaN(ageNumber) || !checkedStates[i]) continue;
          // Find or create attendee
          let attendeeId = null;
          const { data: foundAttendee } = await supabase
            .from('attendees')
            .select('id')
            .eq('name', name)
            .eq('age', ageNumber)
            .single();
          if (foundAttendee && foundAttendee.id) {
            attendeeId = foundAttendee.id;
          } else {
            const { data: newAttendee } = await supabase
              .from('attendees')
              .insert([{ name, age: ageNumber }])
              .select('id')
              .single();
            if (newAttendee && newAttendee.id) {
              attendeeId = newAttendee.id;
            } else {
              continue;
            }
          }
          upsertRows.push({ session_id: sessionId, attendee_id: attendeeId, attended_at: registerDate });
        }
        if (upsertRows.length > 0) {
          console.log('[saveAllAutoFilledRows] ATTEMPTING UPSERT for all auto-filled rows', upsertRows);
          await supabase
            .from('attendance')
            .upsert(upsertRows, { onConflict: 'session_id,attendee_id,attended_at' });
        }
        setAutoFillSaved(true);
      }

      async function saveOrUpdateAttendance(idx: number, name: string, age: string | number, checked: boolean) {
        // If this is the first edit on an auto-filled register, upsert all rows first
        if (autoFilled && !autoFillSaved) {
          await saveAllAutoFilledRows();
        }
        if (!sessionId || !registerDate || !name || !age) {
          return;
        }
        // Find or create attendee
        let attendeeId = null;
        const trimmedName = name.toString().trim();
        const ageNumber = Number(age);
        if (isNaN(ageNumber)) {
          return;
        }
        const { data: foundAttendee } = await supabase
          .from('attendees')
          .select('id')
          .eq('name', trimmedName)
          .eq('age', ageNumber)
          .single();
        if (foundAttendee && foundAttendee.id) {
          attendeeId = foundAttendee.id;
        } else {
          // Create new attendee
          const { data: newAttendee } = await supabase
            .from('attendees')
            .insert([{ name: trimmedName, age: ageNumber }])
            .select('id')
            .single();
          if (newAttendee && newAttendee.id) {
            attendeeId = newAttendee.id;
          } else {
            return;
          }
        }
        if (checked) {
          // Upsert attendance (insert if not exists)
          await supabase
            .from('attendance')
            .upsert([
              {
                session_id: sessionId,
                attendee_id: attendeeId,
                attended_at: registerDate,
              },
            ], { onConflict: 'session_id,attendee_id,attended_at' });
        } else {
          // Remove attendance ONLY for this attendeeId
          await supabase
            .from('attendance')
            .delete()
            .eq('session_id', sessionId)
            .eq('attendee_id', attendeeId)
            .eq('attended_at', registerDate);
        }
        // Refresh UI
        const registers = await fetchRegisters(sessionId, registerDate);
        setRegisters(registers);
      }

      const handleToggle = (idx: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterEdited(true);
        const checked = e.target.checked;
          if (!checked) {
            // If auto-filled and not saved, save all auto-filled rows first
            if (autoFilled && !autoFillSaved) {
              await saveAllAutoFilledRows();
            }
            setRemovingAttendeeIdx(idx);
          } else {
            setCheckedStates(prev => {
              const copy = [...prev];
              copy[idx] = true;
              return copy;
            });
            // Save attendance for this attendee
            const reg = registers[idx];
            await saveOrUpdateAttendance(idx, reg.name, reg.age, true);
          }
      };

      const handleNameChange = (idx: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterEdited(true);
        const newName = e.target.value;
        setRegisters(prev => prev.map((reg, i) => i === idx ? { ...reg, name: newName } : reg));
        // Save attendance for this attendee (if checked)
        const reg = registers[idx];
        await saveOrUpdateAttendance(idx, newName, reg.age, checkedStates[idx]);
      };
      const handleAgeChange = (idx: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterEdited(true);
        const newAge = e.target.value;
        setRegisters(prev => prev.map((reg, i) => i === idx ? { ...reg, age: newAge } : reg));
        // Save attendance for this attendee (if checked)
        const reg = registers[idx];
        await saveOrUpdateAttendance(idx, reg.name, newAge, checkedStates[idx]);
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
              onNameChange={handleNameChange(idx)}
              onAgeChange={handleAgeChange(idx)}
              onCheckedChange={handleToggle(idx)}
            />
          ))}
          <RegisterSlot
            index={registers.length}
            name={newName}
            age={newAge}
            checked={newChecked}
            editable={true}
            onNameChange={e => {
              setRegisterEdited(true);
              setNewName(e.target.value);
            }}
            onAgeChange={e => {
              setRegisterEdited(true);
              setNewAge(e.target.value);
            }}
            onCheckedChange={async e => {
              setRegisterEdited(true);
              const checked = e.target.checked;
              setNewChecked(checked);
              if (checked) {
                  // If auto-filled and not saved, save all auto-filled rows first
                  if (autoFilled && !autoFillSaved) {
                    await saveAllAutoFilledRows();
                  }
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

  // Track if the register was auto-filled for a new date
  const [autoFilled, setAutoFilled] = useState(false);
  useEffect(() => {
    setAutoFillSaved(false); // Reset auto-fill save state on new date/session
    setNoSession(false); // Reset noSession on date/session change
    async function fetchSessionIdAndRegisters() {
      setLoading(true);
      setAutoFilled(false);
      setRegisterEdited(false); // Reset edit state on new date/session
      const { data, error } = await supabase
        .from('Sessions')
        .select('id, frequency')
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
      setFrequency(data?.frequency || "one-off");
      setEditFrequency(data?.frequency || "one-off");
      setError(null);
      if (registerDate) {
        const { data: attendance } = await supabase
          .from('attendance')
          .select('attendee_id')
          .eq('session_id', id)
          .eq('attended_at', registerDate);
        let autoFill = false;
        if (!attendance || attendance.length === 0) {
          autoFill = true;
        }
        if (noSession) {
          setRegisters([]);
          setAutoFilled(false);
        } else {
          const registers = await fetchRegisters(id, registerDate);
          setRegisters(registers);
          setAutoFilled(autoFill);
        }
        setRegisterEdited(false);
      } else {
        setRegisters([]);
      }
      setLoading(false);
    }
    if (sessionName) fetchSessionIdAndRegisters();
    setEditSessionName(sessionName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionName, registerDate, showSessionEditModal]);

  return (
 <div className="p-8 relative min-h-screen">
      <div className="mb-2">
        <button
          className="text-gray-700 hover:underline hover:text-black bg-transparent border-none shadow-none p-0 m-0 text-lg flex items-center"
          style={{ background: 'none', border: 'none' }}
          onClick={() => router.back()}
        >
          <span className="mr-1">&#8592;</span> Go Back
        </button>
      </div>
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
        frequency={frequency}
      />
      <div className="flex items-center gap-2 mb-2">
        <button
          className="px-3 py-1.5 bg-gray-300 text-gray-800 rounded"
          onClick={() => router.push(`/${encodeURIComponent(sessionName)}/data`)}
        >
          Data
        </button>
        <button className="px-3 py-1.5 bg-gray-300 text-gray-800 rounded" onClick={() => setShowSessionEditModal(true)}>Edit</button>
        <button
          className="px-3 py-1.5 bg-gray-300 text-gray-800 rounded"
          onClick={async () => {
            if (!sessionId || !registerDate) return;
            if (!window.confirm('Are you sure you want to clear all attendance for this session and date?')) return;
            await supabase
              .from('attendance')
              .delete()
              .eq('session_id', sessionId)
              .eq('attended_at', registerDate);
            setRegisters([]);
            setCheckedStates([]);
          }}
        >
          Clear
        </button>
        <button
          onClick={() => {
            // Share button handler (copied from SessionHeader)
            // Format date as '12 April 2026'
            const dateObj = new Date(registerDate);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleString('default', { month: 'long' });
            const year = dateObj.getFullYear();
            const formattedDate = `${day} ${month} ${year}`;
            const url = typeof window !== 'undefined' ? window.location.origin + `/${encodeURIComponent(sessionName)}?date=${registerDate}` : '';
            const msg = `I updated the attendance register for ${sessionName} on ${formattedDate}, click here to look: ${url}`;
            if (navigator.share) {
              navigator.share({
                title: `Attendance Register: ${sessionName}`,
                text: msg
              });
            } else {
              alert('Sharing is not supported on this device/browser.');
            }
          }}
          className="px-3 py-1.5 bg-gray-300 text-gray-800 rounded"
          title="Share this register"
        >
          Share
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-lg font-bold border border-gray-300 hover:bg-gray-300"
          title="Need Help?"
          onClick={() => setShowNeedHelpModal(true)}
        >
          ?
        </button>
            {showNeedHelpModal && (
              <NeedHelpModal onClose={() => setShowNeedHelpModal(false)} />
            )}
      </div>

      {/* Edit Modal with session name and frequency input */}
      {showSessionEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Session</h2>
            <label className="block text-gray-700 mb-2 text-left" htmlFor="edit-session-name">Session Name</label>
            <input
              id="edit-session-name"
              type="text"
              className="border p-2 w-full mb-4 text-black bg-gray-100"
              value={editSessionName}
              onChange={e => setEditSessionName(e.target.value)}
              disabled={editLoading}
            />
            <label className="block text-gray-700 mb-2 text-left" htmlFor="edit-session-frequency">Session Frequency</label>
            <select
              id="edit-session-frequency"
              className="border p-2 w-full mb-4 text-black bg-gray-100"
              value={editFrequency}
              onChange={e => setEditFrequency(e.target.value)}
              disabled={editLoading}
            >
              <option value="one-off">One-off</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            {editError && <div className="text-red-500 mb-2">{editError}</div>}
            <div className="w-full flex flex-col items-center">
              <button
                className="mt-2 mb-4 p-0 border-none bg-none text-black underline hover:text-red-600 text-xs cursor-pointer"
                style={{ background: 'none', border: 'none' }}
                onClick={() => { setShowSessionEditModal(false); setShowSessionRemoveModal(true); }}
                disabled={editLoading}
                title="Delete this session"
              >
                Delete this session
              </button>
            </div>
            <div className="flex justify-center gap-4 items-center mt-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300"
                onClick={() => setShowSessionEditModal(false)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={handleSaveSessionName}
                disabled={editSessionName.trim() === "" || editLoading}
              >
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
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
          <div className="flex items-center gap-3 mb-2 mt-6">
            <h1 className="text-2xl text-gray-950 font-bold">Session Details</h1>
          
          </div>
          {autoFilled && !registerEdited && (
            <>
              <div className="mb-4 text-gray-500 text-sm">This register is auto-filled. Make any change to enable saving.</div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="no-session-checkbox"
                  checked={noSession}
                  onChange={e => {
                    const checked = e.target.checked;
                    setNoSession(checked);
                    if (checked) {
                      setRegisters([]);
                      setAutoFilled(false);
                    } else {
                      // Re-fetch auto-filled data if unchecked
                      if (sessionId && registerDate) {
                        fetchRegisters(sessionId, registerDate).then(r => {
                          setRegisters(r);
                          setAutoFilled(true);
                        });
                      }
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="no-session-checkbox" className="text-gray-500 text-sm select-none">
                  There is no session on this date (so it stays empty and does not auto-fill)
                </label>
              </div>
            </>
          )}
          {renderRegisterSlots()}
        </>
      )}
    </div>
  );
}
