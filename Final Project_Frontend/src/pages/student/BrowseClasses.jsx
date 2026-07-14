import { useState, useEffect } from "react";
import { get, post } from "../../api";
import Table from "../../components/Table";

export default function BrowseClasses() {
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await get("/student/classes");
      setClasses(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEnroll = async (classId) => {
    try {
      await post("/student/enroll", { class_id: classId });
      window.alert("Successfully enrolled in the class!");
      loadClasses();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Browse & Enroll in Classes</h2>
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
          { key: "capacity", label: "Capacity" },
          {
            key: "actions",
            label: "",
            render: (row) => (
              <button type="button" onClick={() => handleEnroll(row.id)}>Enroll</button>
            ),
          },
        ]}
        rows={classes}
      />
    </div>
  );
}