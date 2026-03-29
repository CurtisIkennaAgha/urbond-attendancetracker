"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import exportFromJSON from "export-from-json";
import { supabase } from "../../../utils/supabaseClient";

export default function SessionDataPage() {
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
      // Merge attendance and attendee info
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
      // Merge all info
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
      <button
        className="absolute top-4 right-4 bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300 z-50"
        onClick={() => router.back()}
      >
        Go Back
      </button>
      <h1 className="text-2xl text-gray-950 font-bold mb-4">{sessionName}</h1>
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'black' }}>Attendance Spreadsheet</h2>
      {loading ? (
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
                <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                // Format date as dd/mm/yyyy
                let formattedDate = row.attended_at;
                if (row.attended_at) {
                  const d = new Date(row.attended_at);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  formattedDate = `${day}/${month}/${year}`;
                }
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.name}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.age}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{formattedDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <select value={downloadType} onChange={e => setDownloadType(e.target.value)} style={{ padding: 4, fontSize: 12, color: 'black' }}>
          <option value="Google Sheets">Google Sheets</option>
          <option value="Excel">Excel</option>
          <option value="CSV">CSV</option>
        </select>
        <button onClick={handleDownload} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #222', background: '#eee', cursor: 'pointer', color: 'black' }}>Download</button>
      </div>

      {/* All sessions spreadsheet */}
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'black', marginTop: 16 }}>Attendance Spreadsheet (All Sessions)</h2>
      {allLoading ? (
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
                <th style={{ border: '1px solid black', padding: '2px', fontWeight: 'normal', background: '#f5f5f5' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {allSessionsData.map((row, idx) => {
                // Format date as dd/mm/yyyy
                let formattedDate = row.Date;
                if (row.Date) {
                  const d = new Date(row.Date);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  formattedDate = `${day}/${month}/${year}`;
                }
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.Session}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.Name}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{row.Age}</td>
                    <td style={{ border: '1px solid black', padding: '2px' }}>{formattedDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <select value={allDownloadType} onChange={e => setAllDownloadType(e.target.value)} style={{ padding: 4, fontSize: 12, color: 'black' }}>
          <option value="Google Sheets">Google Sheets</option>
          <option value="Excel">Excel</option>
          <option value="CSV">CSV</option>
        </select>
        <button onClick={handleAllDownload} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #222', background: '#eee', cursor: 'pointer', color: 'black' }}>Download</button>
      </div>
      {/* All attendees spreadsheet */}
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'black', marginTop: 16 }}>Attendees Spreadsheet (All Sessions)</h2>
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
    </div>
  );
}
