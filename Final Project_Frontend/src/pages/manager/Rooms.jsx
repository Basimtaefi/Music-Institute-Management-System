import { useState, useEffect } from "react";
import { get, post, put } from "../../api";
import Table from "../../components/Table"; // use table component

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState("Classroom");
  const [newStatus, setNewStatus] = useState("Available");

  const [editingId, setEditingId] = useState(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomType, setEditRoomType] = useState("Classroom");
  const [editStatus, setEditStatus] = useState("Available");

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await get("/manager/rooms");
      setRooms(data);
    } catch (err) {
      setError(err.message);
    }
  }

  const handleNewRoomNameChange = (event) => {
    const newText = event.target.value;
    setNewRoomName(newText);
  }

  const handleNewRoomTypeChange = (event) => {
    const newText = event.target.value;
    setNewRoomType(newText);
  }

  const handleNewStatusChange = (event) => {
    const newText = event.target.value;
    setNewStatus(newText);
  }

  const handleShowAddForm = () => {
    setShowAddForm(true);
  }

  const handleAddRoom = async () => {
    try {
      await post("/manager/rooms", {
        room_name: newRoomName,
        room_type: newRoomType,
        status: newStatus,
      })
      // refresh : 
      handleCancelAdd();
      loadRooms();
    } catch (error) {
      setError(error.message);
    }
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
    setNewRoomName('')
    setNewRoomType('Classroom')
    setNewStatus('Available')
  }

  const handleEditRoomNameChange = (event) => {
    const newText = event.target.value;
    setEditRoomName(newText);
  }

  const handleEditRoomTypeChange = (event) => {
    const newText = event.target.value;
    setEditRoomType(newText);
  }

  const handleEditStatusChange = (event) => {
    const newText = event.target.value;
    setEditStatus(newText);
  }

  const handleEdit = (room) => {
    setEditingId(room.id); // get the Id of room that manager wants to edit !
    setEditRoomName(room.room_name);
    setEditRoomType(room.room_type);
    setEditStatus(room.status);
  }

  const handleUpdateRoom = async () => {
    try {
      await put(`/manager/rooms/${editingId}`, {
        room_name: editRoomName,
        room_type: editRoomType,
        status: editStatus,
      });
      window.alert("Room has been updated!");
      handleCancelEdit();
      loadRooms();
    } catch (error) {
      setError(error.message);
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null); // disapears editing page
    setEditRoomName("");
    setEditRoomType("Classroom");
    setEditStatus("Available");
  }

  return (
    <div>
      <h2>Rooms</h2>
      {error && <p className="error-text">{error}</p>}

      {!showAddForm && (
        <button type="button" onClick={handleShowAddForm}>Add New Room</button>
      )}

      {showAddForm && (
        <div>
          <h3>Add New Room</h3>
          <label>Room Name:</label>
          <input type="text" value={newRoomName} onChange={handleNewRoomNameChange} />

          <label>Type:</label>
          <select value={newRoomType} onChange={handleNewRoomTypeChange}>
            <option value="Classroom">Classroom</option>
            <option value="Practice">Practice</option>
          </select>

          <label>Status:</label>
          <select value={newStatus} onChange={handleNewStatusChange}>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <button type="button" onClick={handleAddRoom}>Add Room</button>
          <button type="button" onClick={handleCancelAdd}>Cancel</button>
        </div>
      )}

      {editingId && (
        <div>
          <h3>Edit Room</h3>
          <label>Room Name:</label>
          <input type="text" value={editRoomName} onChange={handleEditRoomNameChange} />

          <label>Type:</label>
          <select value={editRoomType} onChange={handleEditRoomTypeChange}>
            <option value="Classroom">Classroom</option>
            <option value="Practice">Practice</option>
          </select>

          <label>Status:</label>
          <select value={editStatus} onChange={handleEditStatusChange}>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <button type="button" onClick={handleUpdateRoom}>Update Room</button>
          <button type="button" onClick={handleCancelEdit}>Cancel</button>
        </div>
      )}
      
      <Table
        columns={[
          { key: "room_name", label: "Room Name" },
          { key: "room_type", label: "Type" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "",
            render: (row) => <button type="button" onClick={() => handleEdit(row)}>Edit</button>,
          },
        ]}
        rows={rooms}
      />
      {/* fill the table with proper data */}
    </div>
  );
}