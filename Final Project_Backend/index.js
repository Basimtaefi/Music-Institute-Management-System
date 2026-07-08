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

//



//---------------------- app listen : 

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});