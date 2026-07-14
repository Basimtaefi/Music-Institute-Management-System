import { useState, useEffect } from "react";
import { get, post, put, del } from "../../api";
import Table from "../../components/Table";

export default function Instruments() {
  const [instruments, setInstruments] = useState([]);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState("Available");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("Available");

  useEffect(() => {
    loadInstruments();
  }, []);

  const loadInstruments = async () => {
    try {
      const data = await get("/manager/instruments");
      setInstruments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setEditingId(null);
  };

  const handleNewNameChange = (event) => {
    const newText = event.target.value;
    setNewName(newText);
  };

  const handleNewStatusChange = (event) => {
    const newText = event.target.value;
    setNewStatus(newText);
  };

  const handleAddInstrument = async () => {
    try {
      await post("/manager/instruments", {
        name: newName,
        status: newStatus
      });
      
      handleCancelAdd();
      loadInstruments();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewName("");
    setNewStatus("Available");
  };

  const handleEditNameChange = (event) => {
    const newText = event.target.value;
    setEditName(newText);
  };

  const handleEditStatusChange = (event) => {
    const newText = event.target.value;
    setEditStatus(newText);
  };

  const handleEdit = (instrument) => {
    setEditingId(instrument.id);
    setEditName(instrument.name);
    setEditStatus(instrument.status);
    setShowAddForm(false);
  };

  const handleUpdateInstrument = async () => {
    try {
      await put(`/manager/instruments/${editingId}`, {
        name: editName,
        status: editStatus
      });
      window.alert("Instrument has been updated!");
      handleCancelEdit();
      loadInstruments();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditStatus("Available");
  };

  const handleDelete = async (id) => {
  const confirmed = window.confirm("Are you sure you want to delete this instrument?");
  if (!confirmed) {
    return;
  }

  try {
    await del(`/manager/instruments/${id}`);
    loadInstruments();
  } catch (error) {
    setError(error.message);
  }
};

  return (
    <div>
      <h2>Instruments</h2>
      {error && <p className="error-text">{error}</p>}

      {!showAddForm && (
        <button type="button" className="button-add" onClick={handleShowAddForm}>Add New Instrument</button>
      )}

      {showAddForm && (
        <div className="card">
          <h3>Add New Instrument</h3>
          <label>Name:</label>
          <input type="text" value={newName} onChange={handleNewNameChange} />

          <label>Status:</label>
          <select value={newStatus} onChange={handleNewStatusChange}>
            <option value="Available">Available</option>
            <option value="Borrowed">Borrowed</option>
            <option value="Under Repair">Under Repair</option>
          </select>

          <button type="button" onClick={handleAddInstrument}>Add Instrument</button>
          <button type="button" onClick={handleCancelAdd}>Cancel</button>
        </div>
      )}

      {editingId && (
        <div className="card">
          <h3>Edit Instrument</h3>
          <label>Name:</label>
          <input type="text" value={editName} onChange={handleEditNameChange} />

          <label>Status:</label>
          <select value={editStatus} onChange={handleEditStatusChange}>
            <option value="Available">Available</option>
            <option value="Borrowed">Borrowed</option>
            <option value="Under Repair">Under Repair</option>
          </select>

          <button type="button" onClick={handleUpdateInstrument}>Update Instrument</button>
          <button type="button" onClick={handleCancelEdit}>Cancel</button>
        </div>
      )}

      {!showAddForm && !editingId && (
        <Table
        columns={[
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
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
        rows={instruments}
      />
      )}
    </div>
  );
}