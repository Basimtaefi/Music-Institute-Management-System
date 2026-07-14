import { useState, useEffect } from "react";
import { get, post, put, del } from "../../api";
import Table from "../../components/Table";

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newReservationType, setNewReservationType] = useState("Individual");
  const [newParticipantCount, setNewParticipantCount] = useState("1");
  const [newReservationDate, setNewReservationDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editRoomId, setEditRoomId] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [editReservationType, setEditReservationType] = useState("Individual");
  const [editParticipantCount, setEditParticipantCount] = useState("1");
  const [editReservationDate, setEditReservationDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  useEffect(() => {
    loadReservations();
    loadRooms();
    loadStudents();
  }, []);

  const loadReservations = async () => {
    try {
      const data = await get("/manager/reservations");
      setReservations(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await get("/manager/rooms");
      setRooms(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await get("/manager/students");
      setStudents(data);
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

  const handleNewStudentIdChange = (event) => {
    const newText = event.target.value;
    setNewStudentId(newText);
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
      await post("/manager/reservations", {
        room_id: newRoomId,
        student_id: newStudentId,
        reservation_type: newReservationType,
        participant_count: newParticipantCount,
        reservation_date: newReservationDate,
        start_time: newStartTime,
        end_time: newEndTime,
      });
      handleCancelAdd();
      loadReservations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewRoomId("");
    setNewStudentId("");
    setNewReservationType("Individual");
    setNewParticipantCount("1");
    setNewReservationDate("");
    setNewStartTime("");
    setNewEndTime("");
  };

  const handleEditRoomIdChange = (event) => {
    const newText = event.target.value;
    setEditRoomId(newText);
  };

  const handleEditStudentIdChange = (event) => {
    const newText = event.target.value;
    setEditStudentId(newText);
  };

  const handleEditReservationTypeChange = (event) => {
    const newText = event.target.value;
    setEditReservationType(newText);
  };

  const handleEditParticipantCountChange = (event) => {
    const newText = event.target.value;
    setEditParticipantCount(newText);
  };

  const handleEditReservationDateChange = (event) => {
    const newText = event.target.value;
    setEditReservationDate(newText);
  };

  const handleEditStartTimeChange = (event) => {
    const newText = event.target.value;
    setEditStartTime(newText);
  };

  const handleEditEndTimeChange = (event) => {
    const newText = event.target.value;
    setEditEndTime(newText);
  };

  const handleEdit = (reservation) => {
    setEditingId(reservation.id);
    setEditRoomId(reservation.room_id);
    setEditStudentId(reservation.student_id);
    setEditReservationType(reservation.reservation_type);
    setEditParticipantCount(reservation.participant_count);
    setEditReservationDate(reservation.reservation_date);
    setEditStartTime(reservation.start_time);
    setEditEndTime(reservation.end_time);
  };

  const handleUpdateReservation = async () => {
    try {
      await put(`/manager/reservations/${editingId}`, {
        room_id: editRoomId,
        student_id: editStudentId,
        reservation_type: editReservationType,
        participant_count: editParticipantCount,
        reservation_date: editReservationDate,
        start_time: editStartTime,
        end_time: editEndTime,
      });
      window.alert("Reservation has been updated!");
      handleCancelEdit();
      loadReservations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRoomId("");
    setEditStudentId("");
    setEditReservationType("Individual");
    setEditParticipantCount("1");
    setEditReservationDate("");
    setEditStartTime("");
    setEditEndTime("");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this reservation?");
    if (!confirmed) {
      return;
    }

    try {
      await del(`/manager/reservations/${id}`);
      loadReservations();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Reservations</h2>
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

          <label>Student:</label>
          <select value={newStudentId} onChange={handleNewStudentIdChange}>
            <option value="">Choose one option</option>
            {students.map((student) => (
              <option key={student.student_id} value={student.student_id}>
                {student.full_name}
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

      {editingId && (
        <div>
          <h3>Edit Reservation</h3>
          <label>Room:</label>
          <select value={editRoomId} onChange={handleEditRoomIdChange}>
            <option value="">Choose one option</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_name}
              </option>
            ))}
          </select>

          <label>Student:</label>
          <select value={editStudentId} onChange={handleEditStudentIdChange}>
            <option value="">Choose one option</option>
            {students.map((student) => (
              <option key={student.student_id} value={student.student_id}>
                {student.full_name}
              </option>
            ))}
          </select>

          <label>Reservation Type:</label>
          <select value={editReservationType} onChange={handleEditReservationTypeChange}>
            <option value="Individual">Individual</option>
            <option value="Group">Group</option>
          </select>

          <label>Participant Count:</label>
          <input type="number" value={editParticipantCount} onChange={handleEditParticipantCountChange} />

          <label>Date:</label>
          <input type="date" value={editReservationDate} onChange={handleEditReservationDateChange} />

          <label>Start Time:</label>
          <input type="time" value={editStartTime} onChange={handleEditStartTimeChange} />

          <label>End Time:</label>
          <input type="time" value={editEndTime} onChange={handleEditEndTimeChange} />

          <button type="button" onClick={handleUpdateReservation}>Update Reservation</button>
          <button type="button" onClick={handleCancelEdit}>Cancel</button>
        </div>
      )}

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
          {
            key: "actions",
            label: "",
            render: (row) => (
              <>
                <button type="button" onClick={() => handleEdit(row)}>Edit</button>
                <button type="button" onClick={() => handleDelete(row.id)}>Delete</button>
              </>
            ),
          },
        ]}
        rows={reservations}
      />
    </div>
  );
}