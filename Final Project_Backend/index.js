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

  const existing_email = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${user_id}`;
  if (existing_email.length > 0) {
    return res.status(400).json({ message: 'This email is already taken !' });
  }

  const updatedUser = await sql`
    UPDATE users SET full_name = ${full_name}, phone = ${phone}, email = ${email}, password = ${password}
    WHERE id = ${user_id}
    RETURNING *`;

  await sql`UPDATE students SET instrument_focus = ${instrument_focus} WHERE student_id = ${student_id}`;

  res.json(updatedUser[0]);
});


//----------------------------------
//---------------------------------- Teachers :

// Teachers classes :

app.get('/api/teacher/classes', requireRole('teacher'), async (req, res) => {
  const teacher_id = req.user.teacher_id;
  const classes = await sql`
    SELECT classes.*,
      courses.course_name,
      courses.level,
      rooms.room_name
    FROM classes
    JOIN courses ON classes.course_id = courses.id
    JOIN rooms ON classes.room_id = rooms.id
    WHERE classes.teacher_id = ${teacher_id}
    ORDER BY classes.day, classes.start_time`;

  res.json(classes);
});

// Teacher -> Students of a Class : //

app.get('/api/teacher/classes/:id/students', requireRole('teacher'), async (req, res) => {
  const class_id = req.params.id;
  const teacher_id = req.user.teacher_id;

  const classExists = await sql`SELECT id FROM classes WHERE id = ${class_id} AND teacher_id = ${teacher_id}`;
  if (classExists.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }

  const students = await sql`SELECT enrollments.id AS enrollment_id, students.student_id, users.full_name AS student_name
    FROM enrollments
    JOIN students ON enrollments.student_id = students.student_id
    JOIN users ON students.user_id = users.id
    WHERE enrollments.class_id = ${class_id} AND enrollments.status = 'active' `;

  res.json(students);
});

// Sessions of a Class :

app.get('/api/teacher/classes/:id/sessions', requireRole('teacher'), async (req, res) => {
  const class_id = req.params.id;
  const teacher_id = req.user.teacher_id;

  const classExists = await sql`SELECT id FROM classes WHERE id = ${class_id} AND teacher_id = ${teacher_id}`;
  if (classExists.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }

  const sessions = await sql`SELECT DISTINCT session_records.session_number, session_records.session_date
    FROM session_records
    JOIN enrollments ON session_records.enrollment_id = enrollments.id
    WHERE enrollments.class_id = ${class_id}
    ORDER BY session_records.session_date`;

  res.json(sessions);
});

// Add new Session reacord : 

app.post('/api/teacher/session-records', requireRole('teacher'), async (req, res) => {
  const { enrollment_id, session_number, session_date, attendance, evaluation, comment } = req.body;
  const teacher_id = req.user.teacher_id;

  const validEnrollment = await sql`
    SELECT enrollments.id FROM enrollments
    JOIN classes ON enrollments.class_id = classes.id
    WHERE enrollments.id = ${enrollment_id} AND classes.teacher_id = ${teacher_id}`;

  if (validEnrollment.length === 0) {
    return res.status(403).json({ message: 'This student is not in your class !' });
  }

  const newRecordSession = await sql`
    INSERT INTO session_records (enrollment_id, session_number, session_date, attendance, evaluation, comment)
    VALUES (${enrollment_id}, ${session_number}, ${session_date}, ${attendance}, ${evaluation}, ${comment})
    RETURNING *`;

  res.send(newRecordSession[0]);
});

// Edit Session :

app.put('/api/teacher/session-records/:id', requireRole('teacher') , async (req, res) => {
  const { attendance, evaluation, comment } = req.body;
  const record_id = req.params.id;
  const teacher_id = req.user.teacher_id;

  // used ai for this part (check that session record belongs to the teacher) : 
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

app.get('/api/teacher/reservations', requireRole('teacher'), async(req, res) => { // used ai to find query :
  
  const allReservations = await sql`
    SELECT practice_reservations.*, users.full_name, rooms.room_name
    FROM practice_reservations
    JOIN rooms ON practice_reservations.room_id = rooms.id
    JOIN students ON practice_reservations.student_id = students.student_id
    JOIN users ON students.user_id = users.id
    ORDER BY practice_reservations.reservation_date, practice_reservations.start_time`;

  res.json(allReservations);
});


// Get students of teacher : 

app.get('/api/teacher/students/:id', requireRole('teacher'), async (req, res) => {
  const student_id = req.params.id;
  const teacher_id = req.user.teacher_id;

  const student = await sql`
    SELECT DISTINCT students.*, users.full_name, users.email, users.phone
    FROM students
    JOIN users ON students.user_id = users.id
    JOIN enrollments ON enrollments.student_id = students.student_id
    JOIN classes ON enrollments.class_id = classes.id
    WHERE students.student_id = ${student_id} AND classes.teacher_id = ${teacher_id}`;

  if (student.length === 0) {
    return res.status(404).json({ message: 'Student not found' });
  }

  res.json(student[0]);
});

// Update teacher profile : 

app.put('/api/teacher/profile', requireRole('teacher'), async (req, res) => {
  const { full_name, phone, email, password, specialization } = req.body;
  const user_id = req.user.id;

  const existing_email = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${user_id}`;
  if (existing_email.length > 0) {
    return res.status(400).json({ message: 'This email is already taken !' });
  }

  const updatedUser = await sql`
    UPDATE users SET full_name = ${full_name}, phone = ${phone}, email = ${email}, password = ${password}
    WHERE id = ${user_id}
    RETURNING *`;

    await sql`UPDATE teachers SET specialization = ${specialization} WHERE teacher_id = ${req.user.teacher_id}`;

    res.json(updatedUser[0]);
});


//----------------------------------
//---------------------------------- Manager :

// ---------------------------------- Users Management :
// Get all users by role : 

app.get('/api/manager/users', requireRole('manager'), async (req, res) => {
  const { role } = req.query;

  if (role) {
    const users = await sql`SELECT * FROM users WHERE role = ${role} ORDER BY id`; // filter by role
    return res.json(users);
  }
  const users = await sql`SELECT * FROM users ORDER BY id`;

  res.json(users);
});

// Get one user :

app.get('/api/manager/users/:id', requireRole('manager'), async (req, res) => {
  const user_id = req.params.id;
  const user = await sql`SELECT * FROM users WHERE id = ${user_id}`;
  
  if(user.length === 0) {
    return res.status(404).json({ message: 'User not found !' });
  }
  
  res.json(user[0]);
});
 
// Add new user :

app.post('/api/manager/users', requireRole('manager'), async (req, res) => {
  const {full_name, email, password, role, phone, instrument_focus, specialization} = req.body; 
  const existUser = await sql`SELECT id FROM users WHERE email = ${email}`;

  if (existUser.length > 0) {
    return res.status(400).json({ message: 'This user already exists !' });
  }

  const newUser = await sql` 
  INSERT INTO users (full_name, email, password, role, phone)       
  VALUES (${full_name}, ${email}, ${password}, ${role}, ${phone}) RETURNING *`;

  if (role === 'student') {
    await sql`INSERT INTO students (user_id, instrument_focus) VALUES (${newUser[0].id}, ${instrument_focus})`;
  } 
  else if (role === 'teacher') {
    await sql`INSERT INTO teachers (user_id, specialization) VALUES (${newUser[0].id}, ${specialization})`;
  }

  res.send(newUser[0]);
});

// Edit User : //

app.put('/api/manager/users/:id', requireRole('manager'), async (req, res) => {
  const { full_name, email, password, role, phone, instrument_focus, specialization } = req.body;
  const user_id = req.params.id;

  const existing_email = await sql `SELECT id FROM users WHERE email = ${email} AND id != ${user_id}`; 
  if(existing_email.length > 0) {
    return res.status(400).json({message: 'This email is already taken !'});
  }
  
  const updatedUser = await sql `
    UPDATE users SET full_name = ${full_name}, phone = ${phone}, email = ${email}, password = ${password}
    WHERE id = ${user_id}
    RETURNING *`;

  if (updatedUser.length === 0) {
    return res.status(404).json({ message: 'User not found !' });
  }

  if (updatedUser[0].role === 'student') {
    await sql`UPDATE students SET instrument_focus = ${instrument_focus} WHERE user_id = ${user_id}`;
  }
  else if (updatedUser[0].role === 'teacher') {
    await sql`UPDATE teachers SET specialization = ${specialization} WHERE user_id = ${user_id}`;
  }  
  
  res.json(updatedUser[0]);
});

// Delete User :

app.delete('/api/manager/users/:id', requireRole('manager'), async (req, res) => {
  const user_id = req.params.id;
  const deleted = await sql`DELETE FROM users WHERE id = ${user_id} RETURNING *`;

  if (deleted.length === 0) {
    return res.status(404).json({ message: 'User not found !' });
  }

  res.json({ message: 'User deleted successfully !' });
});                     


// ---------------------------------- Course Management :

// Get all courses :

app.get('/api/manager/courses', requireRole('manager'), async (req, res) => {
  const courses = await sql`SELECT * FROM courses ORDER BY id`;
  res.json(courses);
});

// Get one course :

app.get('/api/manager/courses/:id', requireRole('manager'), async (req, res) => {
  const course_id = req.params.id;
  const course = await sql `SELECT * FROM courses WHERE id = ${course_id}`;    

  if (course.length === 0) {
    return res.status(404).json({ message: 'Course not found !' });
  }
  
  res.json(course[0]);
});

// Add new course :

app.post('/api/manager/courses', requireRole('manager'), async (req, res) => {
  const course_name = req.body.course_name;
  const level = req.body.level;
  const description = req.body.description;

  const newCourse = await sql`
    INSERT INTO courses (course_name, level, description)
    VALUES (${course_name}, ${level}, ${description})
    RETURNING *`;

  res.send(newCourse[0]);
});

// Edit course :

app.put('/api/manager/courses/:id', requireRole('manager'), async (req, res) => {
  const { course_name, level, description } = req.body;
  const course_id = req.params.id;

  const updatedCourse = await sql`
    UPDATE courses SET course_name = ${course_name}, level = ${level}, description = ${description}
    WHERE id = ${course_id}
    RETURNING *`;

  if (updatedCourse.length === 0) {
    return res.status(404).json({ message: 'Course not found !' });
  }

  res.json(updatedCourse[0]);
});

// Delete course :

app.delete('/api/manager/courses/:id', requireRole('manager'), async (req, res) => {
  const course_id = req.params.id;
  const deleted = await sql`DELETE FROM courses WHERE id = ${course_id} RETURNING *`; 
  
  if (deleted.length === 0) {
    return res.status(404).json({ message: 'Course not found !' });
  } 

  res.json({ message: 'Course deleted successfully !' });
});


// ---------------------------------- Classes Management :

// Get all classes :
// Used AI to write this query :
app.get('/api/manager/classes', requireRole('manager'), async (req, res) => {
  const classes = await sql` 
    SELECT classes.*, courses.course_name, courses.level, users.full_name AS teacher_name, rooms.room_name
    FROM classes
    JOIN courses ON classes.course_id = courses.id
    JOIN teachers ON classes.teacher_id = teachers.teacher_id
    JOIN users ON teachers.user_id = users.id
    JOIN rooms ON classes.room_id = rooms.id
    ORDER BY classes.day, classes.start_time`;
  
  res.json(classes);
});

// Get one class :

app.get('/api/manager/classes/:id', requireRole('manager'), async (req, res) => {
  const class_id = req.params.id;
  const thisClass = await sql`
    SELECT classes.*, courses.course_name, courses.level, users.full_name AS teacher_name, rooms.room_name
    FROM classes
    JOIN courses ON classes.course_id = courses.id
    JOIN teachers ON classes.teacher_id = teachers.teacher_id
    JOIN users ON teachers.user_id = users.id
    JOIN rooms ON classes.room_id = rooms.id
    WHERE classes.id = ${class_id}`;

    if (thisClass.length === 0) {
      return res.status(404).json({ message: 'Class not found !' });
    }
    
  res.json(thisClass[0]);
});

// Create new class : // Used AI to write this query :

app.post('/api/manager/classes', requireRole('manager'), async (req, res) => { // 
  const { course_id, teacher_id, room_id, class_type, capacity, day, start_time, end_time, term_number, term_fee } = req.body;
  
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
    INSERT INTO classes (course_id, teacher_id, room_id, class_type, capacity, day, start_time, end_time, term_number, term_fee)
    VALUES (${course_id}, ${teacher_id}, ${room_id}, ${class_type}, ${capacity}, ${day}, ${start_time}, ${end_time}, ${term_number}, ${term_fee})
    RETURNING *`;

  res.send(newClass[0]);
});

// Edit class : // Used AI to write this query :

app.put('/api/manager/classes/:id', requireRole('manager'), async (req, res) => {
  const { course_id, teacher_id, room_id, class_type, capacity, day, start_time, end_time, term_number, term_fee } = req.body;
  const class_id = req.params.id;

  const teacherConflict = await sql`
    SELECT id FROM classes
    WHERE teacher_id = ${teacher_id} AND day = ${day}
      AND start_time < ${end_time} AND end_time > ${start_time}
      AND id != ${class_id}`; // Different classes in the same time
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
      course_id = ${course_id}, teacher_id = ${teacher_id}, room_id = ${room_id}, class_type = ${class_type}, capacity = ${capacity}, day = ${day},
      start_time = ${start_time}, end_time = ${end_time}, term_number = ${term_number}, term_fee = ${term_fee}
    WHERE id = ${class_id}
    RETURNING *`;  

  if (updatedClass.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }  

  res.send(updatedClass[0]);
});

// Delete class : // has problem for payment in enrollment !

app.delete('/api/manager/classes/:id', requireRole('manager'), async (req, res) => {
  const class_id = req.params.id;

  const enrolled = await sql`SELECT id FROM enrollments WHERE class_id = ${class_id} AND status = 'active'`;
  if (enrolled.length > 0) {
    return res.status(400).json({ message: 'Cannot delete a class that has active enrollments !' });
  }

  const deleted = await sql`DELETE FROM classes WHERE id = ${class_id} RETURNING *`;
  if (deleted.length === 0) {
    return res.status(404).json({ message: 'Class not found !' });
  }

  res.json({ message: 'Class deleted successfully !' });
});

// ---------------------------------- Room Management :

// Get all Rooms : 

app.get('/api/manager/rooms', requireRole('manager'), async (req, res) => {
  const rooms = await sql`SELECT * FROM rooms ORDER BY id`;
  res.json(rooms);
});

// get one room : 

app.get('/api/manager/rooms/:id', requireRole('manager'), async (req, res) => {
  const room_id = req.params.id;
  const room = await sql`SELECT * FROM rooms WHERE id = ${room_id}`;

  if (room.length === 0) {
    return res.status(404).json({ message: 'Room not found !' });
  }
  
  res.json(room[0]);
});

// Add new room :

app.post('/api/manager/rooms', requireRole('manager'), async (req, res) => {
  const room_name = req.body.room_name;
  const room_type = req.body.room_type;
  const status = req.body.status;

  const newRoom = await sql`
    INSERT INTO rooms (room_name, room_type, status)
    VALUES (${room_name}, ${room_type}, ${status})
    RETURNING *`;

  res.send(newRoom[0]);
});

app.put('/api/manager/rooms/:id', requireRole('manager'), async (req, res) => {
  const room_id = req.params.id;
  const room_name = req.body.room_name;
  const room_type = req.body.room_type;
  const status = req.body.status;

  const updatedRoom = await sql`
    UPDATE rooms SET room_name = ${room_name}, room_type = ${room_type}, status = ${status}
    WHERE id = ${room_id}
    RETURNING *`;

  if (updatedRoom.length === 0) {
    return res.status(404).json({ message: 'Room not found !' });
  }

  res.json(updatedRoom[0]);
});

app.delete('/api/manager/rooms/:id', requireRole('manager'), async (req, res) => {
  const room_id = req.params.id;

  const usedInClasses = await sql`SELECT id FROM classes WHERE room_id = ${room_id}`;
  if (usedInClasses.length > 0) {
    return res.status(400).json({ message: 'Cannot delete a room that has classes !' });
  }

  const deletedRoom = await sql`DELETE FROM rooms WHERE id = ${room_id} RETURNING *`;
  if (deletedRoom.length === 0) {
    return res.status(404).json({ message: 'Room not found !' });
  }

  res.json({ message: 'Room deleted successfully !' });
});


//// ---------------------------------- Instrument Management :

// Get all instruments :

app.get('/api/manager/instruments', requireRole('manager'), async (req, res) => {
  const instruments = await sql`SELECT * FROM instruments ORDER BY name`;
  res.json(instruments);
});

// Get one instrument : 

app.get('/api/manager/instruments/:id', requireRole('manager'), async (req, res) => {
  const instrument_id = req.params.id;
  const instrument = await sql`SELECT * FROM instruments WHERE id = ${instrument_id}`;

  if (instrument.length === 0) {
    return res.status(404).json({ message: 'Instrument not found !' });
  }

  res.json(instrument[0]);
});

// Add new instrument :

app.post('/api/manager/instruments', requireRole('manager'), async (req, res) => {
  const { name, status } = req.body;
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

// update instrument :

app.put('/api/manager/instruments/:id', requireRole('manager'), async (req, res) => {
  const instrument_id = req.params.id;
  const { name } = req.body;

  const updated = await sql`
    UPDATE instruments SET name = ${name}
    WHERE id = ${instrument_id}
    RETURNING *`;

  if (updated.length === 0) {
    return res.status(404).json({ message: 'Instrument not found !' });
  }

  res.json(updated[0]);
});

// delete instrument : // check if the instrument has loan history before deleting it

app.delete('/api/manager/instruments/:id', requireRole('manager'), async (req, res) => {
  const instrument_id = req.params.id;

  const hasLoanHistory = await sql`SELECT id FROM instrument_loans WHERE instrument_id = ${instrument_id}`;
  if (hasLoanHistory.length > 0) {
    return res.status(400).json({ message: 'Cannot delete an instrument that has loan history !' });
  }

  const deleted = await sql`DELETE FROM instruments WHERE id = ${instrument_id} RETURNING *`;
  if (deleted.length === 0) {
    return res.status(404).json({ message: 'Instrument not found !' });
  }

  res.json({ message: 'Instrument deleted successfully !' });
});

// Get all instrument loans :

app.get('/api/manager/loans', requireRole('manager'), async (req, res) => {
  const loans = await sql`
    SELECT instrument_loans.*, instruments.name AS instrument_name, users.full_name AS student_name
    FROM instrument_loans
    JOIN instruments ON instrument_loans.instrument_id = instruments.id
    JOIN students ON instrument_loans.student_id = students.student_id
    JOIN users ON students.user_id = users.id
    ORDER BY instrument_loans.borrowed_at DESC`;

  res.json(loans);
});

// Get all reseversions : 

app.get('/api/manager/reservations', requireRole('manager'), async (req, res) => {
  const reservations = await sql`
    SELECT practice_reservations.*, rooms.room_name, users.full_name AS student_name
    FROM practice_reservations
    JOIN rooms ON practice_reservations.room_id = rooms.id
    JOIN students ON practice_reservations.student_id = students.student_id
    JOIN users ON students.user_id = users.id
    ORDER BY practice_reservations.reservation_date, practice_reservations.start_time`;

  res.json(reservations);
});

// ---------------------------------- Payments Management :

// Confirm a pending payment :

app.put('/api/manager/payments/:id/confirm', requireRole('manager'), async (req, res) => {
  const payment_id = req.params.id;
  const manager_id = req.user.id;

  const updated = await sql`
    UPDATE payments SET status = 'paid', paid_at = CURRENT_DATE, confirmed_by = ${manager_id}
    WHERE id = ${payment_id} AND status = 'pending'
    RETURNING *`;

  if (updated.length === 0) {
    return res.status(404).json({ message: 'Pending payment not found !' });
  }

  res.json(updated[0]);
});

// ----------
// Update Profiles : 

app.put('/api/manager/profile', requireRole('manager'), async (req, res) => {
  const { full_name, phone, email, password } = req.body;
  const user_id = req.user.id;

  const existingEmail = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${user_id}`;
  if (existingEmail.length > 0) {
    return res.status(400).json({ message: 'This email is already taken !' });
  }

  const updatedUser = await sql`
    UPDATE users SET full_name = ${full_name}, phone = ${phone}, email = ${email}, password = ${password}
    WHERE id = ${user_id}
    RETURNING *`;

  res.json(updatedUser[0]);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});