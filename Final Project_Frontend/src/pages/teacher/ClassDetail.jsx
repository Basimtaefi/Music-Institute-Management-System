import { useState, useEffect } from "react";
import { get, post, put } from "../../api";
import { Link } from "react-router-dom";
import Table from "../../components/Table";

export default function ClassDetail() {
  const params = new URLSearchParams(window.location.search);
  const classId = params.get("id");

  const [roster, setRoster] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showAddSessionForm, setShowAddSessionForm] = useState(false);
  const [newEnrollmentId, setNewEnrollmentId] = useState("");
  const [newSessionNumber, setNewSessionNumber] = useState("1");
  const [newSessionDate, setNewSessionDate] = useState("");
  const [newAttendance, setNewAttendance] = useState("Present");
  const [newEvaluation, setNewEvaluation] = useState("");
  const [newComment, setNewComment] = useState("");

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editAttendance, setEditAttendance] = useState("Present");
  const [editEvaluation, setEditEvaluation] = useState("");
  const [editComment, setEditComment] = useState("");

  useEffect(() => {
    loadRoster();
    loadSessions();
  }, []);

  const loadRoster = async () => {
    try {
      const data = await get(`/teacher/classes/${classId}/students`);
      setRoster(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await get(`/teacher/classes/${classId}/sessions`);
      setSessions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewStudent = async (studentId) => {
    try {
      const data = await get(`/teacher/students/${studentId}`);
      setSelectedStudent(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseStudent = () => {
    setSelectedStudent(null);
  };

  const handleShowAddSessionForm = () => {
    setShowAddSessionForm(true);
    setEditingSessionId(null);
  };

  const handleNewEnrollmentIdChange = (event) => {
    const newText = event.target.value;
    setNewEnrollmentId(newText);
  };

  const handleNewSessionNumberChange = (event) => {
    const newText = event.target.value;
    setNewSessionNumber(newText);
  };

  const handleNewSessionDateChange = (event) => {
    const newText = event.target.value;
    setNewSessionDate(newText);
  };

  const handleNewAttendanceChange = (event) => {
    const newText = event.target.value;
    setNewAttendance(newText);
  };

  const handleNewEvaluationChange = (event) => {
    const newText = event.target.value;
    setNewEvaluation(newText);
  };

  const handleNewCommentChange = (event) => {
    const newText = event.target.value;
    setNewComment(newText);
  };

  const handleAddSession = async () => {
    try {
      await post("/teacher/session-records", {
        enrollment_id: newEnrollmentId,
        session_number: newSessionNumber,
        session_date: newSessionDate,
        attendance: newAttendance,
        evaluation: newEvaluation,
        comment: newComment,
      });
      window.alert("Session record has been added!");
      handleCancelAddSession();
      loadSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelAddSession = () => {
    setShowAddSessionForm(false);
    setNewEnrollmentId("");
    setNewSessionNumber("1");
    setNewSessionDate("");
    setNewAttendance("Present");
    setNewEvaluation("");
    setNewComment("");
  };

  const handleEditSessionAttendanceChange = (event) => {
    const newText = event.target.value;
    setEditAttendance(newText);
  };

  const handleEditSessionEvaluationChange = (event) => {
    const newText = event.target.value;
    setEditEvaluation(newText);
  };

  const handleEditSessionCommentChange = (event) => {
    const newText = event.target.value;
    setEditComment(newText);
  };

  const handleEditSession = (session) => {
    setEditingSessionId(session.id);
    setEditAttendance(session.attendance);
    setEditEvaluation(session.evaluation);
    setEditComment(session.comment);
    setShowAddSessionForm(false);
  };

  const handleUpdateSession = async () => {
    try {
      await put(`/teacher/session-records/${editingSessionId}`, {
        attendance: editAttendance,
        evaluation: editEvaluation,
        comment: editComment,
      });
      window.alert("Session record has been updated!");
      handleCancelEditSession();
      loadSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEditSession = () => {
    setEditingSessionId(null);
    setEditAttendance("Present");
    setEditEvaluation("");
    setEditComment("");
  };

  return (
    <div>
      <Link to="/teacher/my-classes" className="back-link">Back to My Classes</Link>
      <h2>Class Roster</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="roster-table">
        <Table
          columns={[
            { key: "student_name", label: "Student" },
            {
              key: "actions",
              label: "",
              render: (row) => (
                <button type="button" onClick={() => handleViewStudent(row.student_id)}>View Details</button>
              ),
            },
          ]}
          rows={roster}
        />
      </div>

      {selectedStudent && (
        <div className="card">
          <h3>Student Details</h3>
          <p>Full Name: {selectedStudent.full_name}</p>
          <p>Email: {selectedStudent.email}</p>
          <p>Phone: {selectedStudent.phone}</p>
          <p>Instrument Focus: {selectedStudent.instrument_focus}</p>
          <button type="button" onClick={handleCloseStudent}>Close</button>
        </div>
      )}

      {!showAddSessionForm && (
        <button type="button" className="button-add" onClick={handleShowAddSessionForm}>Add Session Record</button>
      )}

      {showAddSessionForm && (
        <div className="card">
          <h3>Add Session Record</h3>
          <label>Student:</label>
          <select value={newEnrollmentId} onChange={handleNewEnrollmentIdChange}>
            <option value="">Choose one option</option>
            {roster.map((student) => (
              <option key={student.enrollment_id} value={student.enrollment_id}>
                {student.student_name}
              </option>
            ))}
          </select>

          <label>Session Number:</label>
          <input type="number" value={newSessionNumber} onChange={handleNewSessionNumberChange} />

          <label>Session Date:</label>
          <input type="date" value={newSessionDate} onChange={handleNewSessionDateChange} />

          <label>Attendance:</label>
          <select value={newAttendance} onChange={handleNewAttendanceChange}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>

          <label>Evaluation:</label>
          <select value={newEvaluation} onChange={handleNewEvaluationChange}>
            <option value="">No evaluation</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Needs Improvement">Needs Improvement</option>
          </select>

          <label>Comment:</label>
          <input type="text" value={newComment} onChange={handleNewCommentChange} />

          <button type="button" onClick={handleAddSession}>Add Session Record</button>
          <button type="button" onClick={handleCancelAddSession}>Cancel</button>
        </div>
      )}

      {editingSessionId && (
        <div className="card">
          <h3>Edit Session Record</h3>
          <label>Attendance:</label>
          <select value={editAttendance} onChange={handleEditSessionAttendanceChange}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>

          <label>Evaluation:</label>
          <select value={editEvaluation} onChange={handleEditSessionEvaluationChange}>
            <option value="">No evaluation</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Needs Improvement">Needs Improvement</option>
          </select>

          <label>Comment:</label>
          <input type="text" value={editComment} onChange={handleEditSessionCommentChange} />

          <button type="button" onClick={handleUpdateSession}>Update Session Record</button>
          <button type="button" onClick={handleCancelEditSession}>Cancel</button>
        </div>
      )}

      {!showAddSessionForm && !editingSessionId && (
        <>
          <h3>Session Records</h3>
          <Table
            columns={[
              { key: "student_name", label: "Student" },
              { key: "session_number", label: "Session #" },
              { key: "session_date", label: "Date" },
              { key: "attendance", label: "Attendance" },
              { key: "evaluation", label: "Evaluation" },
              { key: "comment", label: "Comment" },
              {
                key: "actions",
                label: "",
                render: (row) => (<button type="button" onClick={() => handleEditSession(row)}>Edit</button>),
              },
            ]}
            rows={sessions}
          />
        </>
      )}
    </div>
  );
}