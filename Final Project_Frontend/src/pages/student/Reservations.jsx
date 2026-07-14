import { useState, useEffect } from "react";
import { get, post, del } from "../../api";
import Table from "../../components/Table";

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [newReservationType, setNewReservationType] = useState("Individual");
  const [newParticipantCount, setNewParticipantCount] = useState("1");
  const [newReservationDate, setNewReservationDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  useEffect(() => {
    loadReservations();
    loadRooms();
  }, []);

  const loadReservations = async () => {
    try {
      const data = await get("/student/reservations");
      setReservations(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await get("/student/rooms");
      setRooms(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  const handleNewRoomIdChange = (event) => {
    const newText = event.target.value;
    setNewRoomId(newText);
  };

  const handleNewReservationTypeChange = (event) => {
    const newText = event.target.value;
    setNewReservationType(newText);
  };

  const handleNewParticipantCountChange = (event) => {
    const newText = event.target.value;
    setNewParticipantCount(newText);
  };

  const handleNewReservationDateChange = (event) => {
    const newText = event.target.value;
    setNewReservationDate(newText);
  };

  const handleNewStartTimeChange = (event) => {
    const newText = event.target.value;
    setNewStartTime(newText);
  };

  const handleNewEndTimeChange = (event) => {
    const newText = event.target.value;
    setNewEndTime(newText);
  };

  const handleAddReservation = async () => {
    try {
      await post("/student/reservations", {
        room_id: newRoomId,
        reservation_type: newReservationType,
        participant_count: newParticipantCount,
        reservation_date: newReservationDate,
        start_time: newStartTime,
        end_time: newEndTime,
      });
      window.alert("Reservation has been added!");
      handleCancelAdd();
      loadReservations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewRoomId("");
    setNewReservationType("Individual");
    setNewParticipantCount("1");
    setNewReservationDate("");
    setNewStartTime("");
    setNewEndTime("");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to cancel this reservation?");
    if (!confirmed) {
      return;
    }

    try {
      await del(`/student/reservations/${id}`);
      loadReservations();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Practice Room Reservations</h2>
      {error && <p className="error-text">{error}</p>}

      {!showAddForm && (
        <button type="button" onClick={handleShowAddForm}>Add New Reservation</button>
      )}

      {showAddForm && (
        <div>
          <h3>Add New Reservation</h3>
          <label>Room:</label>
          <select value={newRoomId} onChange={handleNewRoomIdChange}>
            <option value="">Choose one option</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_name}
              </option>
            ))}
          </select>

          <label>Reservation Type:</label>
          <select value={newReservationType} onChange={handleNewReservationTypeChange}>
            <option value="Individual">Individual</option>
            <option value="Group">Group</option>
          </select>

          <label>Participant Count:</label>
          <input type="number" value={newParticipantCount} onChange={handleNewParticipantCountChange} />

          <label>Date:</label>
          <input type="date" value={newReservationDate} onChange={handleNewReservationDateChange} />

          <label>Start Time:</label>
          <input type="time" value={newStartTime} onChange={handleNewStartTimeChange} />

          <label>End Time:</label>
          <input type="time" value={newEndTime} onChange={handleNewEndTimeChange} />

          <button type="button" onClick={handleAddReservation}>Add Reservation</button>
          <button type="button" onClick={handleCancelAdd}>Cancel</button>
        </div>
      )}

      <Table
        columns={[
          { key: "room_name", label: "Room" },
          { key: "reservation_type", label: "Type" },
          { key: "participant_count", label: "Participants" },
          { key: "reservation_date", label: "Date" },
          {
            key: "time",
            label: "Time",
            render: (row) => `${row.start_time}-${row.end_time}`,
          },
          {
            key: "actions",
            label: "",
            render: (row) => (
              <button type="button" onClick={() => handleDelete(row.id)}>Cancel</button>
            ),
          },
        ]}
        rows={reservations}
      />
    </div>
  );
}