import { useState, useEffect } from "react";
import { get, post, put, del } from "../../api";
import Table from "../../components/Table";

//used AI fro correction the class -> adding rooms and teachers

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newLevel, setNewLevel] = useState("Beginner");
  const [newDescription, setNewDescription] = useState("");
  const [newTeacherId, setNewTeacherId] = useState("");
  const [newRoomId, setNewRoomId] = useState("");
  const [newClassType, setNewClassType] = useState("Private");
  const [newCapacity, setNewCapacity] = useState("1");
  const [newDay, setNewDay] = useState("Saturday");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newTermNumber, setNewTermNumber] = useState("1");

  const [editingId, setEditingId] = useState(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editLevel, setEditLevel] = useState("Beginner");
  const [editDescription, setEditDescription] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");
  const [editRoomId, setEditRoomId] = useState("");
  const [editClassType, setEditClassType] = useState("Private");
  const [editCapacity, setEditCapacity] = useState("1");
  const [editDay, setEditDay] = useState("Saturday");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editTermNumber, setEditTermNumber] = useState("1");

  useEffect(() => { // Because information about these also needs to be updated.
    loadClasses();
    loadTeachers();
    loadRooms();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await get("/manager/classes");
      setClasses(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await get("/manager/teachers");
      setTeachers(data);
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

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setEditingId(null);
  };

  const handleNewCourseNameChange = (event) => {
    const newText = event.target.value;
    setNewCourseName(newText);
  };

  const handleNewLevelChange = (event) => {
    const newText = event.target.value;
    setNewLevel(newText);
  };

  const handleNewDescriptionChange = (event) => {
    const newText = event.target.value;
    setNewDescription(newText);
  };

  const handleNewTeacherIdChange = (event) => {
    const newText = event.target.value;
    setNewTeacherId(newText);
  };

  const handleNewRoomIdChange = (event) => {
    const newText = event.target.value;
    setNewRoomId(newText);
  };

  const handleNewClassTypeChange = (event) => {
    const newText = event.target.value;
    setNewClassType(newText);
  };

  const handleNewCapacityChange = (event) => {
    const newText = event.target.value;
    setNewCapacity(newText);
  };

  const handleNewDayChange = (event) => {
    const newText = event.target.value;
    setNewDay(newText);
  };

  const handleNewStartTimeChange = (event) => {
    const newText = event.target.value;
    setNewStartTime(newText);
  };

  const handleNewEndTimeChange = (event) => {
    const newText = event.target.value;
    setNewEndTime(newText);
  };

  const handleNewTermNumberChange = (event) => {
    const newText = event.target.value;
    setNewTermNumber(newText);
  };

  const handleAddClass = async () => {
    try {
      await post("/manager/classes", {
        course_name: newCourseName,
        level: newLevel,
        description: newDescription,
        teacher_id: newTeacherId,
        room_id: newRoomId,
        class_type: newClassType,
        capacity: newCapacity,
        day: newDay,
        start_time: newStartTime,
        end_time: newEndTime,
        term_number: newTermNumber,
      });
      handleCancelAdd();
      loadClasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewCourseName("");
    setNewLevel("Beginner");
    setNewDescription("");
    setNewTeacherId("");
    setNewRoomId("");
    setNewClassType("Private");
    setNewCapacity("1");
    setNewDay("Saturday");
    setNewStartTime("");
    setNewEndTime("");
    setNewTermNumber("1");
  };

  const handleEditCourseNameChange = (event) => {
    const newText = event.target.value;
    setEditCourseName(newText);
  };

  const handleEditLevelChange = (event) => {
    const newText = event.target.value;
    setEditLevel(newText);
  };

  const handleEditDescriptionChange = (event) => {
    const newText = event.target.value;
    setEditDescription(newText);
  };

  const handleEditTeacherIdChange = (event) => {
    const newText = event.target.value;
    setEditTeacherId(newText);
  };

  const handleEditRoomIdChange = (event) => {
    const newText = event.target.value;
    setEditRoomId(newText);
  };

  const handleEditClassTypeChange = (event) => {
    const newText = event.target.value;
    setEditClassType(newText);
  };

  const handleEditCapacityChange = (event) => {
    const newText = event.target.value;
    setEditCapacity(newText);
  };

  const handleEditDayChange = (event) => {
    const newText = event.target.value;
    setEditDay(newText);
  };

  const handleEditStartTimeChange = (event) => {
    const newText = event.target.value;
    setEditStartTime(newText);
  };

  const handleEditEndTimeChange = (event) => {
    const newText = event.target.value;
    setEditEndTime(newText);
  };

  const handleEditTermNumberChange = (event) => {
    const newText = event.target.value;
    setEditTermNumber(newText);
  };

  const handleEdit = (classItem) => {
    setEditingId(classItem.id);
    setEditCourseName(classItem.course_name);
    setEditLevel(classItem.level);
    setEditDescription(classItem.description);
    setEditTeacherId(classItem.teacher_id);
    setEditRoomId(classItem.room_id);
    setEditClassType(classItem.class_type);
    setEditCapacity(classItem.capacity);
    setEditDay(classItem.day);
    setEditStartTime(classItem.start_time);
    setEditEndTime(classItem.end_time);
    setEditTermNumber(classItem.term_number);
    setShowAddForm(false);
  };

   const handleUpdateClass = async () => {
    try {
      await put(`/manager/classes/${editingId}`, {
        course_name: editCourseName,
        level: editLevel,
        description: editDescription,
        teacher_id: editTeacherId,
        room_id: editRoomId,
        class_type: editClassType,
        capacity: editCapacity,
        day: editDay,
        start_time: editStartTime,
        end_time: editEndTime,
        term_number: editTermNumber,
      });
      window.alert("Class has been updated!");
      handleCancelEdit();
      loadClasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCourseName("");
    setEditLevel("Beginner");
    setEditDescription("");
    setEditTeacherId("");
    setEditRoomId("");
    setEditClassType("Private");
    setEditCapacity("1");
    setEditDay("Saturday");
    setEditStartTime("");
    setEditEndTime("");
    setEditTermNumber("1");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this class?");
    if (!confirmed) {
      return;
    }

    try {
      await del(`/manager/classes/${id}`);
      loadClasses();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Classes</h2>
      {error && <p className="error-text">{error}</p>}

      {!showAddForm && (
        <button type="button" className="button-add" onClick={handleShowAddForm}>Add New Class</button>
      )}

      {showAddForm && (
        <div className="card">
          <h3>Add New Class</h3>
          <label>Course Name:</label>
          <input type="text" value={newCourseName} onChange={handleNewCourseNameChange} />

          <label>Level:</label>
          <select value={newLevel} onChange={handleNewLevelChange}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <label>Description:</label>
          <input type="text" value={newDescription} onChange={handleNewDescriptionChange} />

          <label>Teacher:</label>
          <select value={newTeacherId} onChange={handleNewTeacherIdChange}>
            <option value="">Choose one option</option>
            {teachers.map((teacher) => (
              <option key={teacher.teacher_id} value={teacher.teacher_id}>
                {teacher.full_name}
              </option>
            ))}
          </select>

          <label>Room:</label>
          <select value={newRoomId} onChange={handleNewRoomIdChange}>
            <option value="">Choose one option</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_name}
              </option>
            ))}
          </select>

          <label>Class Type:</label>
          <select value={newClassType} onChange={handleNewClassTypeChange}>
            <option value="Private">Private</option>
            <option value="Group">Group</option>
          </select>

          <label>Capacity:</label>
          <input type="number" value={newCapacity} onChange={handleNewCapacityChange} />

          <label>Day:</label>
          <select value={newDay} onChange={handleNewDayChange}>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
          </select>

          <label>Start Time:</label>
          <input type="time" value={newStartTime} onChange={handleNewStartTimeChange} />

          <label>End Time:</label>
          <input type="time" value={newEndTime} onChange={handleNewEndTimeChange} />

          <label>Term Number:</label>
          <input type="number" value={newTermNumber} onChange={handleNewTermNumberChange} />

          <button type="button" onClick={handleAddClass}>Add Class</button>
          <button type="button" onClick={handleCancelAdd}>Cancel</button>
        </div>
      )}

      {editingId && (
        <div className="card">
          <h3>Edit Class</h3>
          <label>Course Name:</label>
          <input type="text" value={editCourseName} onChange={handleEditCourseNameChange} />

          <label>Level:</label>
          <select value={editLevel} onChange={handleEditLevelChange}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <label>Description:</label>
          <input type="text" value={editDescription} onChange={handleEditDescriptionChange} />

          <label>Teacher:</label>
          <select value={editTeacherId} onChange={handleEditTeacherIdChange}>
            <option value="">Choose one option</option>
            {teachers.map((teacher) => (
              <option key={teacher.teacher_id} value={teacher.teacher_id}>
                {teacher.full_name}
              </option>
            ))}
          </select>

          <label>Room:</label>
          <select value={editRoomId} onChange={handleEditRoomIdChange}>
            <option value="">Choose one option</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_name}
              </option>
            ))}
          </select>

          <label>Class Type:</label>
          <select value={editClassType} onChange={handleEditClassTypeChange}>
            <option value="Private">Private</option>
            <option value="Group">Group</option>
          </select>

          <label>Capacity:</label>
          <input type="number" value={editCapacity} onChange={handleEditCapacityChange} />

          <label>Day:</label>
          <select value={editDay} onChange={handleEditDayChange}>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
          </select>

          <label>Start Time:</label>
          <input type="time" value={editStartTime} onChange={handleEditStartTimeChange} />

          <label>End Time:</label>
          <input type="time" value={editEndTime} onChange={handleEditEndTimeChange} />

          <label>Term Number:</label>
          <input type="number" value={editTermNumber} onChange={handleEditTermNumberChange} />

          <button type="button" onClick={handleUpdateClass}>Update Class</button>
          <button type="button" onClick={handleCancelEdit}>Cancel</button>
        </div>
      )}

      {!showAddForm && !editingId && (
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
                <>
                  <button type="button" onClick={() => handleEdit(row)}>Edit</button>
                  <button type="button" onClick={() => handleDelete(row.id)}>Delete</button>
                </>
              ),
            },
          ]}
          rows={classes}
        />
      )}
      
    </div>
  );
}