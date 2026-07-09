const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken'); // for JWT 

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const sql = neon(process.env.DATABASE_URL);
const port = 3000;

//---------------------- APIs :

// Get All Users (Test API) :

app.get('/api/users', async (req, res) => {
    const users = await sql`SELECT * FROM users ORDER BY id`;
    res.json(users);
});

// Middle Ware for JWT (Used AI) : 

function requireRole(role) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided !' });
    }

    try {
      const userData = jwt.verify(token, process.env.JWT_SECRET);

      if (userData.role !== role) {
        return res.status(403).json({ message: 'Access denied !' });
      }

      req.user = userData;
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired token !' });
    }
  };
}

// Login (Using JWT) : (used ai to write code --> write login function based on JWT and use my database)

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (result.length === 0) {
        return res.status(401).json({ message: 'Email or password is wrong' });
    }

    const user = result[0];

    if (user.password !== password) {
        return res.status(401).json({ message: 'Email or password is wrong !' });
    }
    
    const userData = { id: user.id, role: user.role, full_name: user.full_name };

    if (user.role === 'student') {
        const student = await sql`SELECT student_id FROM students WHERE user_id = ${user.id}`;
        userData.student_id = student[0].student_id;
    } else if (user.role === 'teacher') {
        const teacher = await sql`SELECT teacher_id FROM teachers WHERE user_id = ${user.id}`;
        userData.teacher_id = teacher[0].teacher_id;
    }

    // generate token : 
    const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: userData });
});

// Register (Student or Teacher) :

app.post('/api/register', async (req, res) => {
    const { full_name, email, password, role, phone, instrument_focus, specialization } = req.body;

    if (role !== 'student' && role !== 'teacher') {
        return res.status(400).json({ message: 'Role must be student or teacher !' });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
        return res.status(400).json({ message: 'This user already exists !' });
    }

    const newUser = await sql`
        INSERT INTO users (full_name, email, password, role, phone)
        VALUES (${full_name}, ${email}, ${password}, ${role}, ${phone})
        RETURNING *`;

    if (role === 'student') {
        await sql`INSERT INTO students (user_id, instrument_focus) VALUES (${newUser[0].id}, ${instrument_focus})`;
    } else {
        await sql`INSERT INTO teachers (user_id, specialization) VALUES (${newUser[0].id}, ${specialization})`;
    }

    res.send(newUser[0]);
});

//---------------------------------- Students :

// Get all classes for a student : 

app.get('/api/student/enrollments', requireRole('student'), async (req, res) => {
  const enrollments = await sql`
    SELECT
      enrollments.id AS enrollment_id,
      classes.id AS class_id,
      courses.course_name,
      courses.level,
      users.full_name AS teacher_name,
      rooms.room_name,
      classes.day,
      classes.start_time,
      classes.end_time,
      classes.term_number,
      classes.class_type,
      enrollments.status
    FROM enrollments
    JOIN classes ON enrollments.class_id = classes.id
    JOIN courses ON classes.course_id = courses.id
    JOIN teachers ON classes.teacher_id = teachers.teacher_id
    JOIN users ON teachers.user_id = users.id
    JOIN rooms ON classes.room_id = rooms.id
    WHERE enrollments.student_id = ${req.user.student_id} AND enrollments.status = 'active'
    ORDER BY classes.day, classes.start_time
  `;

  res.json(enrollments);
});

// avalaible classes for student :

app.get('/api/student/classes', requireRole('student'), async (req, res) => {
  const classes = await sql`
    SELECT
      classes.id,
      courses.course_name,
      courses.level,
      users.full_name AS teacher_name,
      rooms.room_name,
      classes.class_type,
      classes.capacity,
      classes.day,
      classes.start_time,
      classes.end_time,
      classes.term_fee
    FROM classes
    JOIN courses ON classes.course_id = courses.id
    JOIN teachers ON classes.teacher_id = teachers.teacher_id
    JOIN users ON teachers.user_id = users.id
    JOIN rooms ON classes.room_id = rooms.id
    ORDER BY classes.day, classes.start_time
  `;

  res.json(classes);
});

// Student Enroll (registering) : (Used AI for writing queries)

app.post('/api/student/enroll', requireRole('student'), async (req, res) => {
  const { class_id } = req.body;
  const student_id = req.user.student_id;

  const targetClass = await sql`SELECT * FROM classes WHERE id = ${class_id}`;
  if (targetClass.length === 0) {
    return res.status(404).json({ message: 'Class not found' });
  }

  // Capacity : 

  const enrolledCount = await sql`
    SELECT COUNT(*) FROM enrollments WHERE class_id = ${class_id} AND status = 'active'`;

  if (Number(enrolledCount[0].count) >= targetClass[0].capacity) {
    return res.status(400).json({ message: 'Class is full' });
  }

  // Already Enrolled : 

  const alreadyEnrolled = await sql`
    SELECT * FROM enrollments
    WHERE student_id = ${student_id} AND class_id = ${class_id} AND status = 'active'
  `;
  if (alreadyEnrolled.length > 0) {
    return res.status(400).json({ message: 'Already enrolled in this class' });
  }

  // Time confilct :
  const conflict = await sql`
    SELECT classes.* FROM enrollments
    JOIN classes ON enrollments.class_id = classes.id
    WHERE enrollments.student_id = ${student_id}
      AND enrollments.status = 'active'
      AND classes.day = ${targetClass[0].day}
      AND classes.start_time < ${targetClass[0].end_time}
      AND classes.end_time > ${targetClass[0].start_time}
  `;
  if (conflict.length > 0) {
    return res.status(400).json({ message: 'Time conflict with another enrolled class' });
  }

  // max pending = 3
  const pendingCount = await sql`
    SELECT payments.* FROM payments
    JOIN enrollments ON payments.enrollment_id = enrollments.id
    WHERE enrollments.student_id = ${student_id} AND payments.status = 'pending'
  `;
  if (pendingCount.length >= 3) {
    return res.status(400).json({ message: 'You have too many unpaid balances!\nPlease pay your payments first!' });
  }

  // Enrolling : 
  const newEnrollment = await sql`INSERT INTO enrollments (student_id, class_id)
    VALUES (${student_id}, ${class_id})
    RETURNING *`;

  await sql`INSERT INTO payments (enrollment_id, amount, status)
    VALUES (${newEnrollment[0].id}, ${targetClass[0].term_fee}, 'pending')`;

  res.send(newEnrollment[0]);
});

// Cancel Class :

app.put('/api/student/enrollments/:id/cancel', requireRole('student'), async (req, res) => {
  const { id } = req.params;

  const cancelled = await sql`
    UPDATE enrollments SET status = 'cancelled'
    WHERE id = ${id} AND student_id = ${req.user.student_id} AND status = 'active'
    RETURNING *`;

  if (cancelled.length === 0) {
    return res.status(404).json({ message: 'Enrollment not found' });
  }

  res.json(cancelled[0]);
});

// Student Payments :

app.get('/api/student/payments', requireRole('student'), async (req, res) => {
  const student_id = req.user.student_id;
  const payments = await sql`
    SELECT 
      payments.*, 
      courses.course_name,
      courses.level
    FROM payments
    JOIN enrollments ON payments.enrollment_id = enrollments.id
    JOIN classes ON enrollments.class_id = classes.id
    JOIN courses ON classes.course_id = courses.id
    WHERE enrollments.student_id = ${student_id}
    ORDER BY payments.id DESC`;
  res.json(payments);
});

// Rooms List :

app.get('/api/student/rooms', requireRole('student'), async (req, res) => {
  const rooms = await sql`
    SELECT id, room_name FROM rooms
    WHERE room_type = 'Practice' AND status != 'Maintenance'`;
  res.json(rooms);
});

// Reseverd Rooms for Srudent : 

app.get('/api/student/reservations', requireRole('student'), async (req, res) => {
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

// Student Reserving : // 

app.post('/api/student/reservations', requireRole('student'), async (req, res) => {
  const { room_id, reservation_type, participant_count, reservation_date, start_time, end_time } = req.body;
  const student_id = req.user.student_id;

  const room = await sql`SELECT * FROM rooms WHERE id = ${room_id} AND room_type = 'Practice' AND status != 'Maintenance'`;
  if (room.length === 0) {
    return res.status(404).json({ message: 'Practice room not found !' });
  }

  const conflict = await sql`
    SELECT * FROM practice_reservations
    WHERE room_id = ${room_id}
      AND reservation_date = ${reservation_date}
      AND start_time < ${end_time}
      AND end_time > ${start_time} `;

  if (conflict.length > 0) {
    return res.status(400).json({ message: 'Room already reserved for this time !' });
  }

  const newReservation = await sql`
    INSERT INTO practice_reservations (room_id, student_id, reservation_type, participant_count, reservation_date, start_time, end_time)
    VALUES (${room_id}, ${student_id}, ${reservation_type}, ${participant_count}, ${reservation_date}, ${start_time}, ${end_time})
    RETURNING *`;

  res.send(newReservation[0]);
});

// Cancel Reservation : 

app.delete('/api/student/reservations/:id', requireRole('student'), async (req, res) => {
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

app.get('/api/student/instruments', requireRole('student'), async (req, res) => {
  const instruments = await sql`SELECT id, name FROM instruments WHERE status = 'Available'`;
  res.json(instruments);
});

// Student instrument loans :

app.get('/api/student/instrument-loans', requireRole('student'), async (req, res) => {
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

app.post('/api/student/instrument-loans', requireRole('student'), async (req, res) => {
  const { instrument_id, due_date } = req.body;
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

  res.send(newLoan[0]);
});

// Cancel borrow :

app.put('/api/student/instrument-loans/:id/return', requireRole('student'), async (req, res) => {
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

app.get('/api/student/attendance', requireRole('student'), async (req, res) => {
  const student_id = req.user.student_id;
  const records = await sql`
    SELECT
      session_records.*,
      courses.course_name
    FROM session_records
    JOIN enrollments ON session_records.enrollment_id = enrollments.id
    JOIN classes ON enrollments.class_id = classes.id
    JOIN courses ON classes.course_id = courses.id
    WHERE enrollments.student_id = ${student_id}
    ORDER BY session_records.session_date DESC`;

  res.json(records);
});

// Edit student profile : 

app.put('/api/student/profile', requireRole('student'), async (req, res) => {
  const { full_name, phone, email, password, instrument_focus } = req.body;
  const user_id = req.user.id;
  const student_id = req.user.student_id;

  const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${user_id}`;
  if (existing.length > 0) {
    return res.status(400).json({ message: 'This email is already taken !' });
  }

  const updatedUser = await sql`
    UPDATE users SET full_name = ${full_name}, phone = ${phone}, email = ${email}, password = ${password}
    WHERE id = ${user_id}
    RETURNING *`;

  await sql`UPDATE students SET instrument_focus = ${instrument_focus} WHERE student_id = ${student_id}`;

  res.json({ message: 'Profile updated successfully !', user: updatedUser[0] });
});

//---------------------------------- app listen : 

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});