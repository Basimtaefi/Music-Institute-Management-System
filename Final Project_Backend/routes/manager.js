const express = require('express');
const router = express.Router();
const { sql, requireRole } = require('../index.js');

//---------------------------------- Manager APIs

//---------------------------------- Students Management :

// Get all students :

router.get('/students', requireRole('manager'), async (req, res) => {
  const students = await sql`SELECT * FROM students ORDER BY student_id`;
  res.json(students);
});

// Get one student :

router.get('/students/:id', requireRole('manager'), async (req, res) => {
  const student_id = req.params.id;
  const student = await sql`SELECT * FROM students WHERE student_id = ${student_id}`;

  if (student.length === 0) {
    return res.status(404).json({ message: 'Student not found !' });
  }

  res.json(student[0]);
});

// Add new student :

router.post('/students', requireRole('manager'), async (req, res) => {
  const { full_name, email, password, phone, instrument_focus } = req.body;

  const existingStudent = await sql`SELECT student_id FROM students WHERE email = ${email}`;
  const existingTeacher = await sql`SELECT teacher_id FROM teachers WHERE email = ${email}`;
  const existingManager = await sql`SELECT manager_id FROM managers WHERE email = ${email}`;

  if (existingStudent.length > 0 || existingTeacher.length > 0 || existingManager.length > 0) {
    return res.status(400).json({ message: 'This email is already registered !' });
  }

  const newStudent = await sql`
    INSERT INTO students (full_name, email, password, phone, instrument_focus)
    VALUES (${full_name}, ${email}, ${password}, ${phone}, ${instrument_focus})
    RETURNING *`;

  res.json(newStudent[0]);
});

// Edit student :

router.put('/students/:id', requireRole('manager'), async (req, res) => {
  const { full_name, email, password, phone, instrument_focus } = req.body;
  const student_id = req.params.id;

  const existingStudent = await sql`SELECT student_id FROM students WHERE email = ${email} AND student_id != ${student_id}`;
  const existingTeacher = await sql`SELECT teacher_id FROM teachers WHERE email = ${email}`;
  const existingManager = await sql`SELECT manager_id FROM managers WHERE email = ${email}`;

  if (existingStudent.length > 0 || existingTeacher.length > 0 || existingManager.length > 0) {
    return res.status(400).json({ message: 'This email is already taken !' });
  }

  const updatedStudent = await sql`
    UPDATE students SET full_name = ${full_name}, email = ${email}, password = ${password}, phone = ${phone}, instrument_focus = ${instrument_focus}
    WHERE student_id = ${student_id}
    RETURNING *`;

  if (updatedStudent.length === 0) {
    return res.status(404).json({ message: 'Student not found !' });
  }

  res.json(updatedStudent[0]);
});

// Delete student :

router.delete('/students/:id', requireRole('manager'), async (req, res) => {
  const student_id = req.params.id;
  const deleted = await sql`DELETE FROM students WHERE student_id = ${student_id} RETURNING *`;

  if (deleted.length === 0) {
    return res.status(404).json({ message: 'Student not found !' });
  }

  res.json({ message: 'Student deleted successfully !' });
});

//---------------------------------- Teachers Management :

// Get all teachers :

router.get('/teachers', requireRole('manager'), async (req, res) => {
  const teachers = await sql`SELECT * FROM teachers ORDER BY teacher_id`;
  res.json(teachers);
});

// Get one teacher :

router.get('/teachers/:id', requireRole('manager'), async (req, res) => {
  const teacher_id = req.params.id;
  const teacher = await sql`SELECT * FROM teachers WHERE teacher_id = ${teacher_id}`;

  if (teacher.length === 0) {
    return res.status(404).json({ message: 'Teacher not found !' });
  }

  res.json(teacher[0]);
});

// Add new teacher :

router.post('/teachers', requireRole('manager'), async (req, res) => {
  const { full_name, email, password, phone, specialization } = req.body;

  const existingStudent = await sql`SELECT student_id FROM students WHERE email = ${email}`;
  const existingTeacher = await sql`SELECT teacher_id FROM teachers WHERE email = ${email}`;
  const existingManager = await sql`SELECT manager_id FROM managers WHERE email = ${email}`;

  if (existingStudent.length > 0 || existingTeacher.length > 0 || existingManager.length > 0) {
    return res.status(400).json({ message: 'This email is already registered !' });
  }

  const newTeacher = await sql`
    INSERT INTO teachers (full_name, email, password, phone, specialization)
    VALUES (${full_name}, ${email}, ${password}, ${phone}, ${specialization})
    RETURNING *`;

  res.json(newTeacher[0]);
});

// Edit teacher :

router.put('/teachers/:id', requireRole('manager'), async (req, res) => {
  const { full_name, email, password, phone, specialization } = req.body;
  const teacher_id = req.params.id;

  const existingStudent = await sql`SELECT student_id FROM students WHERE email = ${email}`;
  const existingTeacher = await sql`SELECT teacher_id FROM teachers WHERE email = ${email} AND teacher_id != ${teacher_id}`;
  const existingManager = await sql`SELECT manager_id FROM managers WHERE email = ${email}`;

  if (existingStudent.length > 0 || existingTeacher.length > 0 || existingManager.length > 0) {
    return res.status(400).json({ message: 'This email is already taken !' });
  }

  const updatedTeacher = await sql`
    UPDATE teachers SET full_name = ${full_name}, email = ${email}, password = ${password}, phone = ${phone}, specialization = ${specialization}
    WHERE teacher_id = ${teacher_id}
    RETURNING *`;

  if (updatedTeacher.length === 0) {
    return res.status(404).json({ message: 'Teacher not found !' });
  }

  res.json(updatedTeacher[0]);
});

// Delete teacher :

router.delete('/teachers/:id', requireRole('manager'), async (req, res) => {
  const teacher_id = req.params.id;
  const deleted = await sql`DELETE FROM teachers WHERE teacher_id = ${teacher_id} RETURNING *`;

  if (deleted.length === 0) {
    return res.status(404).json({ message: 'Teacher not found !' });
  }

  res.json({ message: 'Teacher deleted successfully !' });
});                     

// ---------------------------------- Classes Management :

// Get all classes :
router.get('/classes', requireRole('manager'), async (req, res) => {
  const classes = await sql`
    SELECT classes.*, teachers.full_name AS teacher_name, rooms.room_name
    FROM classes
    JOIN teachers ON classes.teacher_id = teachers.teacher_id
    JOIN rooms ON classes.room_id = rooms.id
    ORDER BY classes.day, classes.start_time`;

  res.json(classes);
});

// Get one class :

router.get('/classes/:id', requireRole('manager'), async (req, res) => {
  const class_id = req.params.id;
  const thisClass = await sql`
    SELECT classes.*, teachers.full_name AS teacher_name, rooms.room_name
    FROM classes
    JOIN teachers ON classes.teacher_id = teachers.teacher_id
    JOIN rooms ON classes.room_id = rooms.id
    WHERE classes.id = ${class_id}`;

  if (thisClass.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }

  res.json(thisClass[0]);
});

// Create new class : // Used AI to write this query :

router.post('/classes', requireRole('manager'), async (req, res) => {
  const { course_name, level, description, teacher_id, room_id, class_type, capacity, day, start_time, end_time, term_number } = req.body;

  const teacherConflict = await sql`
    SELECT id FROM classes
    WHERE teacher_id = ${teacher_id} AND day = ${day}
      AND start_time < ${end_time} AND end_time > ${start_time}`;

  if (teacherConflict.length > 0) {
    return res.status(400).json({ message: 'Teacher already has a class at this time !' });
  }

  const roomConflict = await sql`
    SELECT id FROM classes
    WHERE room_id = ${room_id} AND day = ${day}
      AND start_time < ${end_time} AND end_time > ${start_time}`;

  if (roomConflict.length > 0) {
    return res.status(400).json({ message: 'Room already has a class at this time !' });
  }

  const newClass = await sql`
    INSERT INTO classes (course_name, level, description, teacher_id, room_id, class_type, capacity, day, start_time, end_time, term_number)
    VALUES (${course_name}, ${level}, ${description}, ${teacher_id}, ${room_id}, ${class_type}, ${capacity}, ${day}, ${start_time}, ${end_time}, ${term_number})
    RETURNING *`;

  res.json(newClass[0]);
});

// Edit class : // Used AI to write this query :

router.put('/classes/:id', requireRole('manager'), async (req, res) => {
  const { course_name, level, description, teacher_id, room_id, class_type, capacity, day, start_time, end_time, term_number } = req.body;
  const class_id = req.params.id;

  const teacherConflict = await sql`
    SELECT id FROM classes
    WHERE teacher_id = ${teacher_id} AND day = ${day}
      AND start_time < ${end_time} AND end_time > ${start_time}
      AND id != ${class_id}`;

  if (teacherConflict.length > 0) {
    return res.status(400).json({ message: 'Teacher already has a class at this time !' });
  }

  const roomConflict = await sql`
    SELECT id FROM classes
    WHERE room_id = ${room_id} AND day = ${day}
      AND start_time < ${end_time} AND end_time > ${start_time}
      AND id != ${class_id}`;

  if (roomConflict.length > 0) {
    return res.status(400).json({ message: 'Room already booked at this time !' });
  }

  const updatedClass = await sql`
    UPDATE classes SET
      course_name = ${course_name}, level = ${level}, description = ${description}, teacher_id = ${teacher_id}, room_id = ${room_id},
      class_type = ${class_type}, capacity = ${capacity}, day = ${day}, start_time = ${start_time}, end_time = ${end_time}, term_number = ${term_number}
    WHERE id = ${class_id}
    RETURNING *`;

  if (updatedClass.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }

  res.json(updatedClass[0]);
});

// Delete class :

router.delete('/classes/:id', requireRole('manager'), async (req, res) => {
  const class_id = req.params.id;

  const deleted = await sql`DELETE FROM classes WHERE id = ${class_id} RETURNING *`;
  if (deleted.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }

  res.json({ message: 'Class deleted successfully !' });
});

// ---------------------------------- Room Management :

// Get all Rooms : 

router.get('/rooms', requireRole('manager'), async (req, res) => {
  const rooms = await sql`SELECT * FROM rooms ORDER BY id`;
  res.json(rooms);
});

// Get one room :

router.get('/rooms/:id', requireRole('manager'), async (req, res) => {
  const room_id = req.params.id;
  const room = await sql`SELECT * FROM rooms WHERE id = ${room_id}`;

  if (room.length === 0) {
    return res.status(404).json({ message: 'Room not found !' });
  }

  res.json(room[0]);
});

// Add new room :

router.post('/rooms', requireRole('manager'), async (req, res) => {
  const { room_name, room_type, status } = req.body;

  const newRoom = await sql`
    INSERT INTO rooms (room_name, room_type, status)
    VALUES (${room_name}, ${room_type}, ${status})
    RETURNING *`;

  res.json(newRoom[0]);
});

// Edit room :

router.put('/rooms/:id', requireRole('manager'), async (req, res) => {
  const { room_name, room_type, status } = req.body;
  const room_id = req.params.id;

  const updatedRoom = await sql`
    UPDATE rooms SET room_name = ${room_name}, room_type = ${room_type}, status = ${status}
    WHERE id = ${room_id}
    RETURNING *`;

  if (updatedRoom.length === 0) {
    return res.status(404).json({ message: 'Room not found !' });
  }

  res.json(updatedRoom[0]);
});

// Delete room : 
// marking it status = 'Maintenance' via PUT already covers making it unusable.

// router.delete('/rooms/:id', requireRole('manager'), async (req, res) => {
//   const room_id = req.params.id;

//   const usedInClasses = await sql`SELECT id FROM classes WHERE room_id = ${room_id}`;
//   if (usedInClasses.length > 0) {
//     return res.status(400).json({ message: 'Cannot delete a room that has classes !' });
//   }

//   const deletedRoom = await sql`DELETE FROM rooms WHERE id = ${room_id} RETURNING *`;
//   if (deletedRoom.length === 0) {
//     return res.status(404).json({ message: 'Room not found !' });
//   }

//   res.json({ message: 'Room deleted successfully !' });
// });

// ---------------------------------- Instrument Management :

// Get all instruments :

router.get('/instruments', requireRole('manager'), async (req, res) => {
  const instruments = await sql`SELECT * FROM instruments ORDER BY name`;
  res.json(instruments);
});

// Get one instrument : 

router.get('/instruments/:id', requireRole('manager'), async (req, res) => {
  const instrument_id = req.params.id;
  const instrument = await sql`SELECT * FROM instruments WHERE id = ${instrument_id}`;

  if (instrument.length === 0) {
    return res.status(404).json({ message: 'Instrument not found !' });
  }

  res.json(instrument[0]);
});

// Add new instrument :

router.post('/instruments', requireRole('manager'), async (req, res) => {
  const name = req.body.name;
  const status = req.body.status;
  const instrument = await sql`SELECT id FROM instruments WHERE name = ${name}`;
  
  if (instrument.length > 0) {
    return res.status(400).json({ message: 'This instrument already exists !' });
  }

  const newInstrument = await sql`
    INSERT INTO instruments (name, status)
    VALUES (${name}, ${status})
    RETURNING *`;

  res.json(newInstrument[0]);
});

// Edit instrument :

router.put('/instruments/:id', requireRole('manager'), async (req, res) => {
  const instrument_id = req.params.id;
  const name = req.body.name;
  const status = req.body.status;

  const existing = await sql`SELECT id FROM instruments WHERE name = ${name} AND id != ${instrument_id}`;
  if (existing.length > 0) {
    return res.status(400).json({ message: 'This instrument already exists !' });
  }

  const updated = await sql`
    UPDATE instruments SET name = ${name}, status = ${status}
    WHERE id = ${instrument_id}
    RETURNING *`;
    
    if (updated.length === 0) {
        return res.status(404).json({ message: 'Instrument not found !' });
    }
    res.json(updated[0]);
});

// Delete instrument : (uesd AI to write this query)

router.delete('/instruments/:id', requireRole('manager'), async (req, res) => {
  const instrument_id = req.params.id;

  const activeLoan = await sql`SELECT id FROM instrument_loans WHERE instrument_id = ${instrument_id} AND returned_at IS NULL`;
  if (activeLoan.length > 0) {
    return res.status(400).json({ message: 'Cannot delete instrument that is currently borrowed !' });
  }

  await sql`DELETE FROM instrument_loans WHERE instrument_id = ${instrument_id}`;

  const deleted = await sql`DELETE FROM instruments WHERE id = ${instrument_id} RETURNING *`;
  if (deleted.length === 0) {
    return res.status(404).json({ message: 'Instrument not found !' });
  }

  res.json({ message: 'Instrument deleted successfully !' });
});

// Get all instrument loans :

router.get('/instrument-loans', requireRole('manager'), async (req, res) => {
  const loans = await sql`
    SELECT
      instrument_loans.*, 
      instruments.name AS instrument_name,
      students.full_name AS student_name
    FROM instrument_loans
    JOIN instruments ON instrument_loans.instrument_id = instruments.id
    JOIN students ON instrument_loans.student_id = students.student_id
    ORDER BY instrument_loans.borrowed_at DESC`;

  res.json(loans);
});

// ---------------------------------- Reservations Management :

// Get all reservations : 

router.get('/reservations', requireRole('manager'), async (req, res) => {
  const reservations = await sql`
    SELECT
      practice_reservations.*,
      rooms.room_name,
      students.full_name AS student_name
    FROM practice_reservations
    JOIN rooms ON practice_reservations.room_id = rooms.id
    JOIN students ON practice_reservations.student_id = students.student_id
    ORDER BY practice_reservations.reservation_date, practice_reservations.start_time`;

  res.json(reservations);
});

// Get one reservation :

router.get('/reservations/:id', requireRole('manager'), async (req, res) => {
  const reservation_id = req.params.id;
  const reservation = await sql`
    SELECT
      practice_reservations.*,
      rooms.room_name,
      students.full_name AS student_name
    FROM practice_reservations
    JOIN rooms ON practice_reservations.room_id = rooms.id
    JOIN students ON practice_reservations.student_id = students.student_id
    WHERE practice_reservations.id = ${reservation_id}`;

  if (reservation.length === 0) {
    return res.status(404).json({ message: 'Reservation not found !' });
  }

  res.json(reservation[0]);
});

// Create new reservation :

router.post('/reservations', requireRole('manager'), async (req, res) => {
  const { room_id, student_id, reservation_type, participant_count, reservation_date, start_time, end_time } = req.body;

  const room = await sql`SELECT id FROM rooms WHERE id = ${room_id} AND room_type = 'Practice' AND status != 'Maintenance'`;
  if (room.length === 0) {
    return res.status(404).json({ message: 'Practice room not available !' });
  }

  const roomConflict = await sql`
    SELECT id FROM practice_reservations
    WHERE room_id = ${room_id}
      AND reservation_date = ${reservation_date}
      AND start_time < ${end_time}
      AND end_time > ${start_time}`;

  if (roomConflict.length > 0) {
    return res.status(400).json({ message: 'Room already reserved for this time !' });
  }

  const newReservation = await sql`
    INSERT INTO practice_reservations (room_id, student_id, reservation_type, participant_count, reservation_date, start_time, end_time)
    VALUES (${room_id}, ${student_id}, ${reservation_type}, ${participant_count}, ${reservation_date}, ${start_time}, ${end_time})
    RETURNING *`;

  res.json(newReservation[0]);
});

// Edit reservation :

router.put('/reservations/:id', requireRole('manager'), async (req, res) => {
  const { room_id, student_id, reservation_type, participant_count, reservation_date, start_time, end_time } = req.body;
  const reservation_id = req.params.id;

  const room = await sql`SELECT id FROM rooms WHERE id = ${room_id} AND room_type = 'Practice' AND status != 'Maintenance'`;
  if (room.length === 0) {
    return res.status(404).json({ message: 'Practice room not available !' });
  }

  const roomConflict = await sql`
    SELECT id FROM practice_reservations
    WHERE room_id = ${room_id}
      AND reservation_date = ${reservation_date}
      AND start_time < ${end_time}
      AND end_time > ${start_time}
      AND id != ${reservation_id}`;

  if (roomConflict.length > 0) {
    return res.status(400).json({ message: 'Room already reserved for this time !' });
  }

  const updatedReservation = await sql`
    UPDATE practice_reservations SET
      room_id = ${room_id}, student_id = ${student_id}, reservation_type = ${reservation_type},
      participant_count = ${participant_count}, reservation_date = ${reservation_date}, start_time = ${start_time}, end_time = ${end_time}
    WHERE id = ${reservation_id}
    RETURNING *`;

  if (updatedReservation.length === 0) {
    return res.status(404).json({ message: 'Reservation not found !' });
  }

  res.json(updatedReservation[0]);
});

// Delete reservation :

router.delete('/reservations/:id', requireRole('manager'), async (req, res) => {
  const reservation_id = req.params.id;

  const deleted = await sql`DELETE FROM practice_reservations WHERE id = ${reservation_id} RETURNING *`;
  if (deleted.length === 0) {
    return res.status(404).json({ message: 'Reservation not found !' });
  }

  res.json({ message: 'Reservation deleted successfully !' });
});

// ---------------------------------- Update Profiles : 

router.put('/profile', requireRole('manager'), async (req, res) => {
  const { full_name, phone, email, password } = req.body;
  const manager_id = req.user.manager_id;

  const existingStudent = await sql`SELECT student_id FROM students WHERE email = ${email}`;
  const existingTeacher = await sql`SELECT teacher_id FROM teachers WHERE email = ${email}`;
  const existingManager = await sql`SELECT manager_id FROM managers WHERE email = ${email} AND manager_id != ${manager_id}`;

  if (existingStudent.length > 0 || existingTeacher.length > 0 || existingManager.length > 0) {
    return res.status(400).json({ message: 'This email is already taken !' });
  }

  const updatedManager = await sql`
    UPDATE managers SET full_name = ${full_name}, phone = ${phone}, email = ${email}, password = ${password}
    WHERE manager_id = ${manager_id}
    RETURNING *`;

  res.json(updatedManager[0]);
});

//---------------------------------- Router part :

module.exports = router;