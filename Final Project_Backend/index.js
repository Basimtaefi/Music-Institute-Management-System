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

// for Router :

module.exports.sql = sql;
module.exports.requireRole = requireRole;

// Login (Using JWT) : (used ai to write code --> write login function based on JWT and use my database)

app.post('/api/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  let result = await sql`SELECT * FROM students WHERE email = ${email}`;
  let role = 'student';

  if (result.length === 0) {
    result = await sql`SELECT * FROM teachers WHERE email = ${email}`;
    role = 'teacher';
  }

  if (result.length === 0) {
    result = await sql`SELECT * FROM managers WHERE email = ${email}`;
    role = 'manager';
  }

  if (result.length === 0) {
    return res.status(401).json({ message: 'Email or password is wrong' });
  }

  const user = result[0];

  if (user.password !== password) {
    return res.status(401).json({ message: 'Email or password is wrong !' });
  }

  const userData = { role, full_name: user.full_name };

  if (role === 'student') {
    userData.student_id = user.student_id;
  }
  else if (role === 'teacher') {
    userData.teacher_id = user.teacher_id;
  } 
  else {
    userData.manager_id = user.manager_id;
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

  const existingStudent = await sql`SELECT student_id FROM students WHERE email = ${email}`;
  const existingTeacher = await sql`SELECT teacher_id FROM teachers WHERE email = ${email}`;
  const existingManager = await sql`SELECT manager_id FROM managers WHERE email = ${email}`;

  if (existingStudent.length > 0 || existingTeacher.length > 0 || existingManager.length > 0) {
    return res.status(400).json({ message: 'This email is already registered !' });
  }

  if (role === 'student') {
    const newStudent = await sql`
      INSERT INTO students (full_name, email, password, phone, instrument_focus)
      VALUES (${full_name}, ${email}, ${password}, ${phone}, ${instrument_focus})
      RETURNING *`;
    return res.send(newStudent[0]);
  }
  
  else {
    const newTeacher = await sql`
      INSERT INTO teachers (full_name, email, password, phone, specialization)
      VALUES (${full_name}, ${email}, ${password}, ${phone}, ${specialization})
      RETURNING *`;
    return res.send(newTeacher[0]);
  }
});

//---------------------- Connection for Router : 

const studentRouter = require('./routes/student');
const teacherRouter = require('./routes/teacher');
const managerRouter = require('./routes/manager');

app.use('/api/student', studentRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/manager', managerRouter);

//---------------------- app listen :

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});