"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import exportFromJSON from "export-from-json";
import { supabase } from "../../../utils/supabaseClient";

export default function SessionDataPage() {
  // ...existing code...
  const [allDataDownloadType, setAllDataDownloadType] = useState('Google Sheets');
  function handleDownloadAllData() {
    // Combine all data for export
    const allData = {
      sessionAttendance: data,
      allSessionsAttendance: allSessionsData,
      allAttendees: allAttendees,
    };
    const fileName = 'urbond-attendance-all-data';
    let exportType = allDataDownloadType === 'Google Sheets' ? 'xls' : allDataDownloadType.toLowerCase();
    exportFromJSON({ data: allData, fileName, exportType });
    if (allDataDownloadType === 'Google Sheets') {
      setTimeout(() => {
        window.open('https://docs.google.com/spreadsheets/u/0/', '_blank');
      }, 500);
    }
  }
  // Collapsible state for each table
  const [showAttendance, setShowAttendance] = useState(true);
  const [showAllSessions, setShowAllSessions] = useState(true);
  const [showAllAttendees, setShowAllAttendees] = useState(true);
  const params = useParams();
  const router = useRouter();
  let sessionNameParam = params?.name;
  if (Array.isArray(sessionNameParam)) {
    sessionNameParam = sessionNameParam[0] || "";
  }
  const sessionName = decodeURIComponent(sessionNameParam || "");
  const [sessionId, setSessionId] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Horizontal Attendance Table State ---
  const [pivotedAttendance, setPivotedAttendance] = useState<any[]>([]);
  const [pivotedDates, setPivotedDates] = useState<string[]>([]);
  useEffect(() => {
    async function fetchAllAttendance() {
      setLoading(true);
      setError(null);
      // Get session id
      const { data: session, error: sessionError } = await supabase
        .from("Sessions")
        .select("id")
        .eq("name", sessionName)
        .single();
      if (sessionError || !session) {
        setError("Session not found");
        setLoading(false);
        return;
      }
      setSessionId(session.id);
      // Get all attendance for this session
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("attendee_id, attended_at")
        .eq("session_id", session.id);
      if (attendanceError || !attendance) {
        setError("No attendance data");
        setLoading(false);
        return;
      }
      // Get all attendee details
      const attendeeIds = attendance.map(a => a.attendee_id);
      let attendees: any[] = [];
      if (attendeeIds.length > 0) {
        const { data: attendeesData, error: attendeesError } = await supabase
          .from("attendees")
          .select("id, name, age")
          .in("id", attendeeIds);
        if (attendeesError || !attendeesData) {
          setError("Could not fetch attendee details");
          setLoading(false);
          return;
        }
        attendees = attendeesData;
      }
      // Build unique sorted date list
      const uniqueDates = Array.from(new Set(attendance.map(a => a.attended_at))).sort();
      setPivotedDates(uniqueDates);
      // Build a map: attendeeId -> { name, age }
      const attendeeMap: Record<string, { name: string, age: string }> = {};
      attendees.forEach(a => { attendeeMap[a.id] = { name: a.name, age: a.age }; });
      // Build a map: attendeeId -> Set of attended_at
      const attendanceMap: Record<string, Set<string>> = {};
      attendance.forEach(a => {
        if (!attendanceMap[a.attendee_id]) attendanceMap[a.attendee_id] = new Set();
        attendanceMap[a.attendee_id].add(a.attended_at);
      });
      // Build rows: one per attendee
      const pivotRows = attendees.map(a => {
        const row: any = { name: a.name, age: a.age };
        uniqueDates.forEach(date => {
          row[date] = attendanceMap[a.id]?.has(date) ? '✓' : '';
        });
        return row;
      });
      setPivotedAttendance(pivotRows);
      // Also keep the old flat data for legacy table
      const rows = attendance.map(a => {
        const attendee = attendees.find(at => at.id === a.attendee_id);
        return {
          name: attendee?.name || "",
          age: attendee?.age || "",
          attended_at: a.attended_at,
        };
      });
      setData(rows);
      setLoading(false);
    }
    if (sessionName) fetchAllAttendance();
  }, [sessionName]);

  const [downloadType, setDownloadType] = useState("Google Sheets");
  // For all sessions spreadsheet
  const [allSessionsData, setAllSessionsData] = useState<any[]>([]);
  const [allDownloadType, setAllDownloadType] = useState("Google Sheets");
  const [allLoading, setAllLoading] = useState(true);
  const [allError, setAllError] = useState<string | null>(null);
  // For all attendees spreadsheet
  const [allAttendees, setAllAttendees] = useState<any[]>([]);
  const [attendeesDownloadType, setAttendeesDownloadType] = useState("Google Sheets");
  const [attendeesLoading, setAttendeesLoading] = useState(true);
  const [attendeesError, setAttendeesError] = useState<string | null>(null);

  // Fetch all attendees
  useEffect(() => {
    async function fetchAllAttendees() {
      setAttendeesLoading(true);
      setAttendeesError(null);
      const { data: attendees, error: attendeesError } = await supabase
        .from("attendees")
        .select("id, name, age");
      if (attendeesError || !attendees) {
        setAttendeesError("Could not fetch attendees");
        setAttendeesLoading(false);
        return;
      }
      setAllAttendees(attendees);
      setAttendeesLoading(false);
    }
    fetchAllAttendees();
  }, []);

  function handleAttendeesDownload() {
    const exportData = allAttendees.map(row => ({
      Name: row.name,
      Age: row.age,
      ID: row.id,
    }));
    const fileName = `all-attendees`;
    if (attendeesDownloadType === "CSV" || attendeesDownloadType === "Google Sheets") {
      exportFromJSON({ data: exportData, fileName, exportType: 'csv' });
      if (attendeesDownloadType === "Google Sheets") {
        setTimeout(() => {
          window.open('https://docs.google.com/spreadsheets/u/0/', '_blank');
        }, 500);
      }
    } else if (attendeesDownloadType === "Excel") {
      exportFromJSON({ data: exportData, fileName, exportType: 'xls' });
    }
  }
        {/* All attendees spreadsheet */}
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'black', marginTop: 32 }}>Attendees Spreadsheet (All Sessions)</h2>
        {attendeesLoading ? (
          <p>Loading...</p>
        ) : attendeesError ? (
          <p className="text-red-500">{attendeesError}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', color: 'black', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Name</th>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Age</th>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>ID</th>
                </tr>
              </thead>
              <tbody>
                {allAttendees.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.name}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.age}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <select value={attendeesDownloadType} onChange={e => setAttendeesDownloadType(e.target.value)} style={{ padding: 4, fontSize: 12, color: 'black' }}>
            <option value="Google Sheets">Google Sheets</option>
            <option value="Excel">Excel</option>
            <option value="CSV">CSV</option>
          </select>
          <button onClick={handleAttendeesDownload} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #222', background: '#eee', cursor: 'pointer', color: 'black' }}>Download</button>
        </div>
  // --- Pivoted All Sessions Attendance Table State ---
  const [pivotedAllSessions, setPivotedAllSessions] = useState<any[]>([]);
  const [pivotedAllDates, setPivotedAllDates] = useState<string[]>([]);
  useEffect(() => {
    async function fetchAllSessionsAttendance() {
      setAllLoading(true);
      setAllError(null);
      // Get all attendance
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("attendee_id, attended_at, session_id");
      if (attendanceError || !attendance) {
        setAllError("No attendance data");
        setAllLoading(false);
        return;
      }
      // Get all attendees
      const attendeeIds = attendance.map(a => a.attendee_id);
      let attendees: any[] = [];
      if (attendeeIds.length > 0) {
        const { data: attendeesData, error: attendeesError } = await supabase
          .from("attendees")
          .select("id, name, age")
          .in("id", attendeeIds);
        if (attendeesError || !attendeesData) {
          setAllError("Could not fetch attendee details");
          setAllLoading(false);
          return;
        }
        attendees = attendeesData;
      }
      // Get all sessions
      const sessionIds = attendance.map(a => a.session_id);
      let sessions: any[] = [];
      if (sessionIds.length > 0) {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("Sessions")
          .select("id, name")
          .in("id", sessionIds);
        if (sessionsError || !sessionsData) {
          setAllError("Could not fetch session details");
          setAllLoading(false);
          return;
        }
        sessions = sessionsData;
      }
      // Build unique sorted date list
      const uniqueDates = Array.from(new Set(attendance.map(a => a.attended_at))).sort();
      setPivotedAllDates(uniqueDates);
      // Build a map: attendeeId -> { name, age }
      const attendeeMap: Record<string, { name: string, age: string }> = {};
      attendees.forEach(a => { attendeeMap[a.id] = { name: a.name, age: a.age }; });
      // Build a map: sessionId -> sessionName
      const sessionMap: Record<string, string> = {};
      sessions.forEach(s => { sessionMap[s.id] = s.name; });
      // Build a map: attendeeId+sessionId -> Set of attended_at
      const attendanceMap: Record<string, Set<string>> = {};
      attendance.forEach(a => {
        const key = `${a.attendee_id}__${a.session_id}`;
        if (!attendanceMap[key]) attendanceMap[key] = new Set();
        attendanceMap[key].add(a.attended_at);
      });
      // Build unique attendee-session pairs
      const attendeeSessionPairs: { attendeeId: string, sessionId: string }[] = [];
      attendance.forEach(a => {
        if (!attendeeSessionPairs.find(p => p.attendeeId === a.attendee_id && p.sessionId === a.session_id)) {
          attendeeSessionPairs.push({ attendeeId: a.attendee_id, sessionId: a.session_id });
        }
      });
      // Build rows: one per attendee-session
      const pivotRows = attendeeSessionPairs.map(pair => {
        const row: any = {
          session: sessionMap[pair.sessionId] || '',
          name: attendeeMap[pair.attendeeId]?.name || '',
          age: attendeeMap[pair.attendeeId]?.age || ''
        };
        uniqueDates.forEach(date => {
          const key = `${pair.attendeeId}__${pair.sessionId}`;
          row[date] = attendanceMap[key]?.has(date) ? '✓' : '';
        });
        return row;
      });
      setPivotedAllSessions(pivotRows);
      setPivotedAllDates(uniqueDates);
      // Also keep the old flat data for legacy table
      const rows = attendance.map(a => {
        const attendee = attendees.find(at => at.id === a.attendee_id);
        const session = sessions.find(s => s.id === a.session_id);
        return {
          Session: session?.name || "",
          Name: attendee?.name || "",
          Age: attendee?.age || "",
          Date: a.attended_at,
        };
      });
      setAllSessionsData(rows);
      setAllLoading(false);
    }
    fetchAllSessionsAttendance();
  }, []);
  function handleAllDownload() {
    // Prepare data for export
    const exportData = allSessionsData.map(row => {
      let formattedDate = row.Date;
      if (row.Date) {
        const d = new Date(row.Date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        formattedDate = `${day}/${month}/${year}`;
      }
      return {
        Session: row.Session,
        Name: row.Name,
        Age: row.Age,
        Date: formattedDate,
      };
    });
    const fileName = `all-sessions-attendance`;
    if (allDownloadType === "CSV" || allDownloadType === "Google Sheets") {
      exportFromJSON({ data: exportData, fileName, exportType: 'csv' });
      if (allDownloadType === "Google Sheets") {
        setTimeout(() => {
          window.open('https://docs.google.com/spreadsheets/u/0/', '_blank');
        }, 500);
      }
    } else if (allDownloadType === "Excel") {
      exportFromJSON({ data: exportData, fileName, exportType: 'xls' });
    }
  }

  function handleDownload() {
    // Prepare data for export
    const exportData = data.map(row => {
      let formattedDate = row.attended_at;
      if (row.attended_at) {
        const d = new Date(row.attended_at);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        formattedDate = `${day}/${month}/${year}`;
      }
      return {
        Name: row.name,
        Age: row.age,
        Date: formattedDate,
      };
    });
    const fileName = `${sessionName || 'attendance'}-data`;
    if (downloadType === "CSV" || downloadType === "Google Sheets") {
      exportFromJSON({ data: exportData, fileName, exportType: 'csv' });
      if (downloadType === "Google Sheets") {
        // Open Google Sheets import page after download
        setTimeout(() => {
          window.open('https://docs.google.com/spreadsheets/u/0/', '_blank');
        }, 500);
      }
    } else if (downloadType === "Excel") {
      exportFromJSON({ data: exportData, fileName, exportType: 'xls' });
    }
  }

  return (
    <div className="p-8 relative">
      {/* Title row with Download All Data button inline */}
      <div className="flex items-center mb-6" style={{ color: 'black', gap: 12 }}>
        <h1 className="text-2xl text-gray-950 font-bold mb-0" style={{ marginRight: 0 }}>{sessionName} Data</h1>
        <select value={allDataDownloadType} onChange={e => setAllDataDownloadType(e.target.value)} style={{ padding: 4, fontSize: 12, color: 'black', marginLeft: 8 }}>
          <option value="Google Sheets">Google Sheets</option>
          <option value="Excel">Excel</option>
          <option value="CSV">CSV</option>
        </select>
        <button onClick={handleDownloadAllData} style={{ padding: '6px 18px', fontSize: 13, border: '1px solid #222', background: '#eee', cursor: 'pointer', color: 'black', fontWeight: 600, borderRadius: 6, marginLeft: 4 }}>
          Download All Data
        </button>
      </div>
      <button
        className="absolute top-4 right-4 bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300 z-50"
        onClick={() => router.back()}
      >
        Go Back
      </button>
      <div className="flex items-center mb-2" style={{ color: 'black' }}>
        <h2 className="text-lg font-semibold flex items-center mb-0" style={{ color: 'black' }}>
          <button
            aria-label={showAttendance ? 'Collapse Attendance Table' : 'Expand Attendance Table'}
            title={showAttendance ? 'Collapse table' : 'Expand table'}
            onClick={() => setShowAttendance(v => !v)}
            style={{
              marginRight: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 6,
              transition: 'background 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
            onFocus={e => e.currentTarget.style.background = '#f3f4f6'}
            onBlur={e => e.currentTarget.style.background = 'none'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: showAttendance ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s, stroke 0.2s',
                stroke: '#222',
              }}
              className="chevron-icon"
            >
              <polyline points="6 8 10 12 14 8" stroke={showAttendance ? '#111' : '#222'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ marginLeft: 4, fontSize: 13, color: '#111', fontWeight: 500, letterSpacing: 0.2 }}>{showAttendance ? 'Collapse' : 'Expand'}</span>
          </button>
          Attendance Spreadsheet
        </h2>
        <div className="flex items-center ml-4" style={{ gap: 8 }}>
          <select value={downloadType} onChange={e => setDownloadType(e.target.value)} style={{ padding: 4, fontSize: 12, color: 'black' }}>
            <option value="Google Sheets">Google Sheets</option>
            <option value="Excel">Excel</option>
            <option value="CSV">CSV</option>
          </select>
          <button onClick={handleDownload} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #222', background: '#eee', cursor: 'pointer', color: 'black' }}>Download</button>
        </div>
      </div>
      {showAttendance && (
        loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', color: 'black', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Name</th>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Age</th>
                  {pivotedDates.map(date => {
                    const d = new Date(date);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    const formattedDate = `${day}/${month}/${year}`;
                    return (
                      <th key={date} style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>{formattedDate}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pivotedAttendance.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.name}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.age}</td>
                    {pivotedDates.map(date => (
                      <td key={date} style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{row[date]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* All sessions spreadsheet */}
      <div className="flex items-center mb-2" style={{ color: 'black', marginTop: 24 }}>
        <h2 className="text-lg font-semibold flex items-center mb-0" style={{ color: 'black' }}>
          <button
            aria-label={showAllSessions ? 'Collapse All Sessions Table' : 'Expand All Sessions Table'}
            title={showAllSessions ? 'Collapse table' : 'Expand table'}
            onClick={() => setShowAllSessions(v => !v)}
            style={{
              marginRight: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 6,
              transition: 'background 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
            onFocus={e => e.currentTarget.style.background = '#f3f4f6'}
            onBlur={e => e.currentTarget.style.background = 'none'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: showAllSessions ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s, stroke 0.2s',
                stroke: '#222',
              }}
              className="chevron-icon"
            >
              <polyline points="6 8 10 12 14 8" stroke={showAllSessions ? '#111' : '#222'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ marginLeft: 4, fontSize: 13, color: '#111', fontWeight: 500, letterSpacing: 0.2 }}>{showAllSessions ? 'Collapse' : 'Expand'}</span>
          </button>
          Attendance Spreadsheet (All Sessions)
        </h2>
        <div className="flex items-center ml-4" style={{ gap: 8 }}>
          <select value={allDownloadType} onChange={e => setAllDownloadType(e.target.value)} style={{ padding: 4, fontSize: 12, color: 'black' }}>
            <option value="Google Sheets">Google Sheets</option>
            <option value="Excel">Excel</option>
            <option value="CSV">CSV</option>
          </select>
          <button onClick={handleAllDownload} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #222', background: '#eee', cursor: 'pointer', color: 'black' }}>Download</button>
        </div>
      </div>
      {showAllSessions && (
        allLoading ? (
          <p>Loading...</p>
        ) : allError ? (
          <p className="text-red-500">{allError}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', color: 'black', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Session</th>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Name</th>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Age</th>
                  {pivotedAllDates.map(date => {
                    const d = new Date(date);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    const formattedDate = `${day}/${month}/${year}`;
                    return (
                      <th key={date} style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>{formattedDate}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pivotedAllSessions.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.session}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.name}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.age}</td>
                    {pivotedAllDates.map(date => (
                      <td key={date} style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{row[date]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {/* All attendees spreadsheet */}
      <div className="flex items-center mb-2" style={{ color: 'black', marginTop: 24 }}>
        <h2 className="text-lg font-semibold flex items-center mb-0" style={{ color: 'black' }}>
          <button
            aria-label={showAllAttendees ? 'Collapse All Attendees Table' : 'Expand All Attendees Table'}
            title={showAllAttendees ? 'Collapse table' : 'Expand table'}
            onClick={() => setShowAllAttendees(v => !v)}
            style={{
              marginRight: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 6,
              transition: 'background 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
            onFocus={e => e.currentTarget.style.background = '#f3f4f6'}
            onBlur={e => e.currentTarget.style.background = 'none'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: showAllAttendees ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s, stroke 0.2s',
                stroke: '#222',
              }}
              className="chevron-icon"
            >
              <polyline points="6 8 10 12 14 8" stroke={showAllAttendees ? '#111' : '#222'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ marginLeft: 4, fontSize: 13, color: '#111', fontWeight: 500, letterSpacing: 0.2 }}>{showAllAttendees ? 'Collapse' : 'Expand'}</span>
          </button>
          Attendees Spreadsheet (All Sessions)
        </h2>
        <div className="flex items-center ml-4" style={{ gap: 8 }}>
          <select value={attendeesDownloadType} onChange={e => setAttendeesDownloadType(e.target.value)} style={{ padding: 4, fontSize: 12, color: 'black' }}>
            <option value="Google Sheets">Google Sheets</option>
            <option value="Excel">Excel</option>
            <option value="CSV">CSV</option>
          </select>
          <button onClick={handleAttendeesDownload} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #222', background: '#eee', cursor: 'pointer', color: 'black' }}>Download</button>
        </div>
      </div>
      {showAllAttendees && (
        attendeesLoading ? (
          <p>Loading...</p>
        ) : attendeesError ? (
          <p className="text-red-500">{attendeesError}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', color: 'black', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Name</th>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Age</th>
                  <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>ID</th>
                </tr>
              </thead>
              <tbody>
                {allAttendees.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.name}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.age}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
