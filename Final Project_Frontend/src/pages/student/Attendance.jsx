import { useState, useEffect } from "react";
import { get } from "../../api";
import Table from "../../components/Table";

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const data = await get("/student/attendance");
      setRecords(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>My Attendance</h2>
      {error && <p className="error-text">{error}</p>}

      <Table
        columns={[
          { key: "course_name", label: "Course" },
          { key: "session_number", label: "Session" },
          { key: "session_date", label: "Date" },
          { key: "attendance", label: "Attendance" },
          { key: "evaluation", label: "Evaluation" },
          { key: "comment", label: "Comment" },
        ]}
        rows={records}
      />
    </div>
  );
}