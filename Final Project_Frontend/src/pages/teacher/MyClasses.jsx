import { useState, useEffect } from "react";
import { get } from "../../api";
import { Link } from "react-router-dom";
import Table from "../../components/Table";

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await get("/teacher/classes");
      setClasses(data);
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
          { key: "room_name", label: "Room" },
          { key: "day", label: "Day" },
          {
            key: "time",
            label: "Time",
            render: (row) => `${row.start_time}-${row.end_time}`,
          },
          { key: "class_type", label: "Type" },
          {
            key: "actions",
            label: "",
            render: (row) => (<Link to={`/teacher/class-detail?id=${row.id}`}>View Details</Link>),
          },
        ]}
        rows={classes}
      />
    </div>
  );
}