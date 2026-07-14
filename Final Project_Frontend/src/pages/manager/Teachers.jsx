import { useState, useEffect } from "react";
import { get, post, put, del } from "../../api";
import Table from "../../components/Table";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("Piano");

  const [editingId, setEditingId] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("Piano");

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const data = await get("/manager/teachers");
      setTeachers(data);
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

  const handleNewSpecializationChange = (event) => {
    const newText = event.target.value;
    setNewSpecialization(newText);
  };

  const handleAddTeacher = async () => {
    try {
      await post("/manager/teachers", {
        full_name: newFullName,
        email: newEmail,
        password: newPassword,
        phone: newPhone,
        specialization: newSpecialization,
      });
      handleCancelAdd();
      loadTeachers();
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
    setNewSpecialization("Piano");
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

  const handleEditSpecializationChange = (event) => {
    const newText = event.target.value;
    setEditSpecialization(newText);
  };

  const handleEdit = (teacher) => {
    setEditingId(teacher.teacher_id);
    setEditFullName(teacher.full_name);
    setEditEmail(teacher.email);
    setEditPassword(teacher.password);
    setEditPhone(teacher.phone);
    setEditSpecialization(teacher.specialization);
  };

   const handleUpdateTeacher = async () => {
    try {
      await put(`/manager/teachers/${editingId}`, {
        full_name: editFullName,
        email: editEmail,
        password: editPassword,
        phone: editPhone,
        specialization: editSpecialization,
      });
      window.alert("Teacher has been updated!");
      handleCancelEdit();
      loadTeachers();
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
    setEditSpecialization("Piano");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this teacher?");
    if (!confirmed) {
      return;
    }

    try {
      await del(`/manager/teachers/${id}`);
      loadTeachers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Teachers</h2>
      {error && <p className="error-text">{error}</p>}

      {!showAddForm && (
        <button type="button" onClick={handleShowAddForm}>Add New Teacher</button>
      )}

      {showAddForm && (
        <div>
          <h3>Add New Teacher</h3>
          <label>Full Name:</label>
          <input type="text" value={newFullName} onChange={handleNewFullNameChange} />

          <label>Email:</label>
          <input type="email" value={newEmail} onChange={handleNewEmailChange} />

          <label>Password:</label>
          <input type="password" value={newPassword} onChange={handleNewPasswordChange} />

          <label>Phone:</label>
          <input type="text" value={newPhone} onChange={handleNewPhoneChange} />

          <label>Specialization:</label>
          <select value={newSpecialization} onChange={handleNewSpecializationChange}>
            <option value="Piano">Piano</option>
            <option value="Violin">Violin</option>
            <option value="Guitar">Guitar</option>
            <option value="Vocal Training">Vocal</option>
            <option value="Drums">Drums</option>
          </select>

          <button type="button" onClick={handleAddTeacher}>Add Teacher</button>
          <button type="button" onClick={handleCancelAdd}>Cancel</button>
        </div>
      )}

      {editingId && (
        <div>
          <h3>Edit Teacher</h3>
          <label>Full Name:</label>
          <input type="text" value={editFullName} onChange={handleEditFullNameChange} />

          <label>Email:</label>
          <input type="email" value={editEmail} onChange={handleEditEmailChange} />

          <label>Password:</label>
          <input type="password" value={editPassword} onChange={handleEditPasswordChange} />

          <label>Phone:</label>
          <input type="text" value={editPhone} onChange={handleEditPhoneChange} />

          <label>Specialization:</label>
          <select value={editSpecialization} onChange={handleEditSpecializationChange}>
            <option value="Piano">Piano</option>
            <option value="Violin">Violin</option>
            <option value="Guitar">Guitar</option>
            <option value="Vocal Training">Vocal</option>
            <option value="Drums">Drums</option>
          </select>

          <button type="button" onClick={handleUpdateTeacher}>Update Teacher</button>
          <button type="button" onClick={handleCancelEdit}>Cancel</button>
        </div>
      )}

      <Table
        columns={[
          { key: "full_name", label: "Full Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "specialization", label: "Specialization" },
          {
            key: "actions",
            label: "",
            render: (row) => (
              <>
                <button type="button" onClick={() => handleEdit(row)}>Edit</button>
                <button type="button" onClick={() => handleDelete(row.teacher_id)}>Delete</button>
              </>
            ),
          },
        ]}
        rows={teachers}
      />
    </div>
  );
}