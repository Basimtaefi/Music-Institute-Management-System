const express = require('express');
const router = express.Router();
const { sql, requireRole } = require('../index.js');

//---------------------------------- Teacher APIs :

// Teachers classes :

router.get('/classes', requireRole('teacher'), async (req, res) => {
  const teacher_id = req.user.teacher_id;
  const classes = await sql`
    SELECT
      classes.*,
      rooms.room_name
    FROM classes
    JOIN rooms ON classes.room_id = rooms.id
    WHERE classes.teacher_id = ${teacher_id}
    ORDER BY classes.day, classes.start_time`;

  res.json(classes);
});

// Teacher -> Students of a Class : //

router.get('/classes/:id/students', requireRole('teacher'), async (req, res) => {
  const class_id = req.params.id;
  const teacher_id = req.user.teacher_id;

  const classExists = await sql`SELECT id FROM classes WHERE id = ${class_id} AND teacher_id = ${teacher_id}`;
  if (classExists.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }

  const students = await sql`
    SELECT enrollments.id AS enrollment_id, students.student_id, students.full_name AS student_name
    FROM enrollments
    JOIN students ON enrollments.student_id = students.student_id
    WHERE enrollments.class_id = ${class_id} AND enrollments.status = 'active'`;

  res.json(students);
});

// Sessions of a Class :

router.get('/classes/:id/sessions', requireRole('teacher'), async (req, res) => {
  const class_id = req.params.id;
  const teacher_id = req.user.teacher_id;

  const classExists = await sql`SELECT id FROM classes WHERE id = ${class_id} AND teacher_id = ${teacher_id}`;
  if (classExists.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }

  const sessions = await sql`
      SELECT session_records.*, students.full_name AS student_name
      FROM session_records
      JOIN enrollments ON session_records.enrollment_id = enrollments.id
      JOIN students ON enrollments.student_id = students.student_id
      WHERE enrollments.class_id = ${class_id}
      ORDER BY session_records.session_number`;
  
  res.json(sessions);
});

// Add new Session reacord : 

router.post('/session-records', requireRole('teacher'), async (req, res) => {
  const { enrollment_id, session_number, session_date, attendance, evaluation, comment } = req.body;
  const teacher_id = req.user.teacher_id;

  const validEnrollment = await sql`
    SELECT enrollments.id FROM enrollments
    JOIN classes ON enrollments.class_id = classes.id
    WHERE enrollments.id = ${enrollment_id} AND classes.teacher_id = ${teacher_id}`;

  if (validEnrollment.length === 0) {
    return res.status(403).json({ message: 'This student is not in your class !' });
  }

  const newRecord = await sql`
    INSERT INTO session_records (enrollment_id, session_number, session_date, attendance, evaluation, comment)
    VALUES (${enrollment_id}, ${session_number}, ${session_date}, ${attendance}, ${evaluation}, ${comment})
    RETURNING *`;

  res.json(newRecord[0]);
});

// Edit Session :

router.put('/session-records/:id', requireRole('teacher'), async (req, res) => {
  const { attendance, evaluation, comment } = req.body;
  const record_id = req.params.id;
  const teacher_id = req.user.teacher_id;

  const recordExists = await sql`
    SELECT session_records.id
    FROM session_records
    JOIN enrollments ON session_records.enrollment_id = enrollments.id
    JOIN classes ON enrollments.class_id = classes.id
    WHERE session_records.id = ${record_id} AND classes.teacher_id = ${teacher_id}`;

  if (recordExists.length === 0) {
    return res.status(404).json({ message: 'Session record not found !' });
  }

  const updated = await sql`
    UPDATE session_records SET attendance = ${attendance}, evaluation = ${evaluation}, comment = ${comment}
    WHERE id = ${record_id}
    RETURNING *`;

  res.json(updated[0]);
}); 

// All Reservations :

router.get('/reservations', requireRole('teacher'), async (req, res) => {
  const allReservations = await sql`
    SELECT
      practice_reservations.*,
      students.full_name AS student_name,
      rooms.room_name
    FROM practice_reservations
    JOIN rooms ON practice_reservations.room_id = rooms.id
    JOIN students ON practice_reservations.student_id = students.student_id
    ORDER BY practice_reservations.reservation_date, practice_reservations.start_time`;

  res.json(allReservations);
});


// Get students of teacher : 

router.get('/students/:id', requireRole('teacher'), async (req, res) => {
  const student_id = req.params.id;
  const teacher_id = req.user.teacher_id;

  const student = await sql`
    SELECT students.*
    FROM students
    JOIN enrollments ON enrollments.student_id = students.student_id
    JOIN classes ON enrollments.class_id = classes.id
    WHERE students.student_id = ${student_id} AND classes.teacher_id = ${teacher_id}`;

  if (student.length === 0) {
    return res.status(404).json({ message: 'Student not found !' });
  }

  res.json(student[0]);
});

// Get own profile :

router.get('/profile', requireRole('teacher'), async (req, res) => {
  const teacher_id = req.user.teacher_id;
  const teacher = await sql`SELECT * FROM teachers WHERE teacher_id = ${teacher_id}`;
  res.json(teacher[0]);
});

// Update teacher profile : (used AI for queries)

router.put('/profile', requireRole('teacher'), async (req, res) => {
  const { full_name, phone, email, password, specialization } = req.body;
  const teacher_id = req.user.teacher_id;

  // Checking for duplications :
  const existingStudent = await sql`SELECT student_id FROM students WHERE email = ${email}`;
  const existingTeacher = await sql`SELECT teacher_id FROM teachers WHERE email = ${email} AND teacher_id != ${teacher_id}`;
  const existingManager = await sql`SELECT manager_id FROM managers WHERE email = ${email}`;

  if (existingStudent.length > 0 || existingTeacher.length > 0 || existingManager.length > 0) {
    return res.status(400).json({ message: 'This email is already taken !' });
  }

  const updatedTeacher = await sql`
    UPDATE teachers SET full_name = ${full_name}, phone = ${phone}, email = ${email}, password = ${password}, specialization = ${specialization}
    WHERE teacher_id = ${teacher_id}
    RETURNING *`;

  res.json(updatedTeacher[0]);
});

//---------------------------------- Router part :

module.exports = router;