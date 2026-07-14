import { useState, useEffect } from "react";
import { get } from "../../api";
import Table from "../../components/Table";

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const data = await get("/teacher/reservations");
      setReservations(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Room Reservations</h2>
      {error && <p className="error-text">{error}</p>}

      <Table
        columns={[
          { key: "room_name", label: "Room" },
          { key: "student_name", label: "Student" },
          { key: "reservation_type", label: "Type" },
          { key: "participant_count", label: "Participants" },
          { key: "reservation_date", label: "Date" },
          {
            key: "time",
            label: "Time",
            render: (row) => `${row.start_time}-${row.end_time}`,
          },
        ]}
        rows={reservations}
      />
    </div>
  );
}