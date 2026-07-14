const express = require('express');
const router = express.Router();
const { sql, requireRole } = require('../index.js');

//---------------------------------- Student APIs :

// Get all classes for a student : (Used AI for writing queries)
// Because of overlap between enrollment IDs and class IDs, the * wildcard cannot be used for both

router.get('/enrollments', requireRole('student'), async (req, res) => {
  const student_id = req.user.student_id;
  const enrollments = await sql`
    SELECT
      classes.*,
      enrollments.id AS enrollment_id,
      enrollments.status,
      enrollments.enrolled_at,
      teachers.full_name AS teacher_name,
      rooms.room_name
    FROM enrollments
    JOIN classes ON enrollments.class_id = classes.id
    JOIN teachers ON classes.teacher_id = teachers.teacher_id
    JOIN rooms ON classes.room_id = rooms.id
    WHERE enrollments.student_id = ${student_id} AND enrollments.status = 'active'
    ORDER BY classes.day, classes.start_time`;

  res.json(enrollments);
});

// avalaible classes for student :

router.get('/classes', requireRole('student'), async (req, res) => {
  const classes = await sql`
    SELECT
      classes.*,
      teachers.full_name AS teacher_name,
      rooms.room_name
    FROM classes
    JOIN teachers ON classes.teacher_id = teachers.teacher_id
    JOIN rooms ON classes.room_id = rooms.id
    ORDER BY classes.day, classes.start_time`;

  res.json(classes);
});

// Student Enroll (registering) : (Used AI for writing queries)

router.post('/enroll', requireRole('student'), async (req, res) => {
  const class_id = req.body.class_id;
  const student_id = req.user.student_id;

  const targetClass = await sql`SELECT * FROM classes WHERE id = ${class_id}`;
  if (targetClass.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }

  // Already Enrolled :
  const alreadyEnrolled = await sql`
    SELECT * FROM enrollments
    WHERE student_id = ${student_id} AND class_id = ${class_id} AND status = 'active'`;

  if (alreadyEnrolled.length > 0) {
    return res.status(400).json({ message: 'Already enrolled in this class !' });
  }

  // Capacity :
  const enrolledCount = await sql`
    SELECT COUNT(*) FROM enrollments WHERE class_id = ${class_id} AND status = 'active'`;
    
  if (Number(enrolledCount[0].count) >= targetClass[0].capacity) {
    return res.status(400).json({ message: 'Class is full !' });
  }

  // Time conflict :
  const conflict = await sql`
    SELECT classes.* FROM enrollments
    JOIN classes ON enrollments.class_id = classes.id
    WHERE enrollments.student_id = ${student_id}
      AND enrollments.status = 'active'
      AND classes.day = ${targetClass[0].day}
      AND classes.start_time < ${targetClass[0].end_time}
      AND classes.end_time > ${targetClass[0].start_time}`;

  if (conflict.length > 0) {
    return res.status(400).json({ message: 'Time conflict with another classes !' });
  }

  // Max 4 active enrollments at a time :
  const activeCount = await sql`
    SELECT COUNT(*) FROM enrollments WHERE student_id = ${student_id} AND status = 'active'`;

  if (Number(activeCount[0].count) >= 4) {
    return res.status(400).json({ message: 'You can only enrolled in 4 classes at a time !' });
  }

  // Enrolling :
  const newEnrollment = await sql`
    INSERT INTO enrollments (student_id, class_id)
    VALUES (${student_id}, ${class_id})
    RETURNING *`;

  res.json(newEnrollment[0]);
});

// Cancel Class :

router.put('/enrollments/:id/cancel', requireRole('student'), async (req, res) => {
  const id = req.params.id;
  const student_id = req.user.student_id;

  const cancelled = await sql`
    UPDATE enrollments SET status = 'cancelled'
    WHERE id = ${id} AND student_id = ${student_id} AND status = 'active'
    RETURNING *`;

  if (cancelled.length === 0) {
    return res.status(404).json({ message: 'Enrollment not found !' });
  }

  res.json(cancelled[0]);
});

// Rooms List :

router.get('/rooms', requireRole('student'), async (req, res) => {
  const rooms = await sql`
    SELECT id, room_name FROM rooms
    WHERE room_type = 'Practice' AND status != 'Maintenance'`;
  res.json(rooms);
});

// Reseverd Rooms for Srudent : 

router.get('/reservations', requireRole('student'), async (req, res) => {
  const student_id = req.user.student_id;
  const reservations = await sql`
    SELECT
      practice_reservations.*,
      rooms.room_name
    FROM practice_reservations
    JOIN rooms ON practice_reservations.room_id = rooms.id
    WHERE practice_reservations.student_id = ${student_id}
    ORDER BY practice_reservations.reservation_date, practice_reservations.start_time`;

  res.json(reservations);
});

// Student Reserving : (Used AI for writing queries)

router.post('/reservations', requireRole('student'), async (req, res) => {
  const { room_id, reservation_type, participant_count, reservation_date, start_time, end_time } = req.body;
  const student_id = req.user.student_id;

  // Availability :
  const room = await sql`SELECT * FROM rooms WHERE id = ${room_id} AND room_type = 'Practice' AND status != 'Maintenance'`;

  if (room.length === 0) {
    return res.status(404).json({ message: 'Practice room not available' });
  }

  // Room conflict :
  const roomConflict = await sql`
    SELECT id FROM practice_reservations
    WHERE room_id = ${room_id}
      AND reservation_date = ${reservation_date}
      AND start_time < ${end_time}
      AND end_time > ${start_time}`;

  if (roomConflict.length > 0) {
      return res.status(400).json({ message: 'Room already reserved for this time !' });
  }

  // Student class conflict : 
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(reservation_date).getDay()];

  const classConflict = await sql`
      SELECT classes.id FROM enrollments
      JOIN classes ON enrollments.class_id = classes.id
      WHERE enrollments.student_id = ${student_id}
        AND enrollments.status = 'active'
        AND classes.day = ${dayName}
        AND classes.start_time < ${end_time}
        AND classes.end_time > ${start_time}`;

  if (classConflict.length > 0) {
    return res.status(400).json({ message: 'You have a class at this time' });
  }

  const newReservation = await sql`
    INSERT INTO practice_reservations (room_id, student_id, reservation_type, participant_count, reservation_date, start_time, end_time)
    VALUES (${room_id}, ${student_id}, ${reservation_type}, ${participant_count}, ${reservation_date}, ${start_time}, ${end_time})
    RETURNING *`;

  res.json(newReservation[0]);
});

// Cancel Reservation : 

router.delete('/reservations/:id', requireRole('student'), async (req, res) => {
  const student_id = req.user.student_id;
  const reservation_id = req.params.id;

  const deleted = await sql`
    DELETE FROM practice_reservations
    WHERE id = ${reservation_id} AND student_id = ${student_id}
    RETURNING *`;

  if (deleted.length === 0) {
    return res.status(404).json({ message: 'Reservation not found !' });
  }

  res.json({ message: 'Reservation cancelled Successfully !' });
});

// availabe instrument loans :

router.get('/instruments', requireRole('student'), async (req, res) => {
  const instruments = await sql`SELECT id, name FROM instruments WHERE status = 'Available'`;
  res.json(instruments);
});

// Student instrument loans :

router.get('/instrument-loans', requireRole('student'), async (req, res) => {
  const student_id = req.user.student_id;
  const loans = await sql`
    SELECT
      instrument_loans.*,
      instruments.name
    FROM instrument_loans
    JOIN instruments ON instrument_loans.instrument_id = instruments.id
    WHERE instrument_loans.student_id = ${student_id}
    ORDER BY instrument_loans.borrowed_at DESC`;

  res.json(loans);
});

// Student borrow instrument :

router.post('/instrument-loans', requireRole('student'), async (req, res) => {
  const instrument_id = req.body.instrument_id;
  const due_date = req.body.due_date;
  const student_id = req.user.student_id;

  const instrument = await sql`SELECT * FROM instruments WHERE id = ${instrument_id} AND status = 'Available'`;
  if (instrument.length === 0) {
    return res.status(400).json({ message: 'Instrument not Available !' });
  }

  const newLoan = await sql`
    INSERT INTO instrument_loans (instrument_id, student_id, due_date)
    VALUES (${instrument_id}, ${student_id}, ${due_date})
    RETURNING *`;

  await sql`UPDATE instruments SET status = 'Borrowed' WHERE id = ${instrument_id}`;

  res.json(newLoan[0]);
});

// Cancel borrow :

router.put('/instrument-loans/:id/return', requireRole('student'), async (req, res) => {
  const student_id = req.user.student_id;
  const loan_id = req.params.id;

  const loan = await sql`
    UPDATE instrument_loans
    SET returned_at = CURRENT_DATE
    WHERE id = ${loan_id} AND student_id = ${student_id} AND returned_at IS NULL
    RETURNING *`;

  if (loan.length === 0) {
    return res.status(404).json({ message: 'Loan not found !' });
  }

  await sql`UPDATE instruments SET status = 'Available' WHERE id = ${loan[0].instrument_id}`;

  res.json({ message: 'Instrument returned successfully !' });
});

// Student Attendence : 

router.get('/attendance', requireRole('student'), async (req, res) => {
  const student_id = req.user.student_id;
  const records = await sql`
    SELECT
      session_records.*,
      classes.course_name
    FROM session_records
    JOIN enrollments ON session_records.enrollment_id = enrollments.id
    JOIN classes ON enrollments.class_id = classes.id
    WHERE enrollments.student_id = ${student_id}
    ORDER BY session_records.session_date DESC`;

  res.json(records);
});

// Get own profile :

router.get('/profile', requireRole('student'), async (req, res) => {
  const student_id = req.user.student_id;
  const student = await sql`SELECT * FROM students WHERE student_id = ${student_id}`;
  res.json(student[0]);
});

// Edit student profile : (uesd AI for writing queries) 

router.put('/profile', requireRole('student'), async (req, res) => {
  const { full_name, phone, email, password, instrument_focus } = req.body;
  const student_id = req.user.student_id;

  const existingStudent = await sql`SELECT student_id FROM students WHERE email = ${email} AND student_id != ${student_id}`;
  const existingTeacher = await sql`SELECT teacher_id FROM teachers WHERE email = ${email}`;
  const existingManager = await sql`SELECT manager_id FROM managers WHERE email = ${email}`;

  if (existingStudent.length > 0 || existingTeacher.length > 0 || existingManager.length > 0) {
    return res.status(400).json({ message: 'This email is already taken !' });
  }

  const updatedStudent = await sql`
    UPDATE students SET full_name = ${full_name}, phone = ${phone}, email = ${email}, password = ${password}, instrument_focus = ${instrument_focus}
    WHERE student_id = ${student_id}
    RETURNING *`;

  res.json(updatedStudent[0]);
});

//---------------------------------- Router part :

module.exports = router;