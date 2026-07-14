import { useState, useEffect } from "react";
import { get, post, put, del } from "../../api";
import Table from "../../components/Table";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newInstrumentFocus, setNewInstrumentFocus] = useState("Piano");

  const [editingId, setEditingId] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editInstrumentFocus, setEditInstrumentFocus] = useState("Piano");

  useEffect(() => {
    loadStudents();
  }, []);

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

  const handleNewFullNameChange = (event) => {
    const newText = event.target.value;
    setNewFullName(newText);
  };

  const handleNewEmailChange = (event) => {
    const newText = event.target.value;
    setNewEmail(newText);
  };

  const handleNewPasswordChange = (event) => {
    const newText = event.target.value;
    setNewPassword(newText);
  };

  const handleNewPhoneChange = (event) => {
    const newText = event.target.value;
    setNewPhone(newText);
  };

  const handleNewInstrumentFocusChange = (event) => {
    const newText = event.target.value;
    setNewInstrumentFocus(newText);
  };

  const handleAddStudent = async () => {
    try {
      await post("/manager/students", {
        full_name: newFullName,
        email: newEmail,
        password: newPassword,
        phone: newPhone,
        instrument_focus: newInstrumentFocus,
      });
      handleCancelAdd();
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewFullName("");
    setNewEmail("");
    setNewPassword("");
    setNewPhone("");
    setNewInstrumentFocus("Piano");
  };

  const handleEditFullNameChange = (event) => {
    const newText = event.target.value;
    setEditFullName(newText);
  };

  const handleEditEmailChange = (event) => {
    const newText = event.target.value;
    setEditEmail(newText);
  };

  const handleEditPasswordChange = (event) => {
    const newText = event.target.value;
    setEditPassword(newText);
  };

  const handleEditPhoneChange = (event) => {
    const newText = event.target.value;
    setEditPhone(newText);
  };

  const handleEditInstrumentFocusChange = (event) => {
    const newText = event.target.value;
    setEditInstrumentFocus(newText);
  };

  const handleEdit = (student) => {
    setEditingId(student.student_id);
    setEditFullName(student.full_name);
    setEditEmail(student.email);
    setEditPassword(student.password);
    setEditPhone(student.phone);
    setEditInstrumentFocus(student.instrument_focus);
  };

  const handleUpdateStudent = async () => {
    try {
      await put(`/manager/students/${editingId}`, {
        full_name: editFullName,
        email: editEmail,
        password: editPassword,
        phone: editPhone,
        instrument_focus: editInstrumentFocus,
      });
      window.alert("Student has been updated!");
      handleCancelEdit();
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFullName("");
    setEditEmail("");
    setEditPassword("");
    setEditPhone("");
    setEditInstrumentFocus("Piano");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this student?");
    if (!confirmed) {
      return;
    }

    try {
      await del(`/manager/students/${id}`);
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Students</h2>
      {error && <p className="error-text">{error}</p>}

      {!showAddForm && (
        <button type="button" onClick={handleShowAddForm}>Add New Student</button>
      )}

      {showAddForm && (
        <div>
          <h3>Add New Student</h3>
          <label>Full Name:</label>
          <input type="text" value={newFullName} onChange={handleNewFullNameChange} />

          <label>Email:</label>
          <input type="email" value={newEmail} onChange={handleNewEmailChange} />

          <label>Password:</label>
          <input type="password" value={newPassword} onChange={handleNewPasswordChange} />

          <label>Phone:</label>
          <input type="text" value={newPhone} onChange={handleNewPhoneChange} />

          <label>Instrument Focus:</label>
          <select value={newInstrumentFocus} onChange={handleNewInstrumentFocusChange}>
            <option value="Piano">Piano</option>
            <option value="Violin">Violin</option>
            <option value="Guitar">Guitar</option>
            <option value="Vocal Training">Vocal</option>
            <option value="Drums">Drums</option>
          </select>

          <button type="button" onClick={handleAddStudent}>Add Student</button>
          <button type="button" onClick={handleCancelAdd}>Cancel</button>
        </div>
      )}

      {editingId && (
        <div>
          <h3>Edit Student</h3>
          <label>Full Name:</label>
          <input type="text" value={editFullName} onChange={handleEditFullNameChange} />

          <label>Email:</label>
          <input type="email" value={editEmail} onChange={handleEditEmailChange} />

          <label>Password:</label>
          <input type="password" value={editPassword} onChange={handleEditPasswordChange} />

          <label>Phone:</label>
          <input type="text" value={editPhone} onChange={handleEditPhoneChange} />

          <label>Instrument Focus:</label>
          <select value={editInstrumentFocus} onChange={handleEditInstrumentFocusChange}>
            <option value="Piano">Piano</option>
            <option value="Violin">Violin</option>
            <option value="Guitar">Guitar</option>
            <option value="Vocal Training">Vocal</option>
            <option value="Drums">Drums</option>
          </select>

          <button type="button" onClick={handleUpdateStudent}>Update Student</button>
          <button type="button" onClick={handleCancelEdit}>Cancel</button>
        </div>
      )}

      <Table
        columns={[
          { key: "full_name", label: "Full Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "instrument_focus", label: "Instrument Focus" },
          {
            key: "actions",
            label: "",
            render: (row) => (
              <>
                <button type="button" onClick={() => handleEdit(row)}>Edit</button>
                <button type="button" onClick={() => handleDelete(row.student_id)}>Delete</button>
              </>
            ),
          },
        ]}
        rows={students}
      />
    </div>
  );
}