import { useState, useEffect } from "react";
import { get, put } from "../../api";
import Table from "../../components/Table";

export default function MyClasses() {
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const data = await get("/student/enrollments");
      setEnrollments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = async (enrollmentId) => {
    const confirmed = window.confirm("Are you sure you want to cancel this class?");
    if (!confirmed) {
      return;
    }

    try {
      await put(`/student/enrollments/${enrollmentId}/cancel`);
      window.alert("Class has been cancelled!");
      loadEnrollments();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>My Classes</h2>
      {error && <p className="error-text">{error}</p>}

      <Table
        columns={[
          { key: "course_name", label: "Course Name" },
          { key: "level", label: "Level" },
          { key: "teacher_name", label: "Teacher" },
          { key: "room_name", label: "Room" },
          { key: "day", label: "Day" },
          {
            key: "time",
            label: "Time",
            render: (row) => `${row.start_time}-${row.end_time}`,
          },
          { key: "class_type", label: "Type" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "",
            render: (row) => (
              <button type="button" onClick={() => handleCancel(row.enrollment_id)}>Cancel</button>
            ),
          },
        ]}
        rows={enrollments}
      />
    </div>
  );
}