const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const dbPath = path.join(__dirname, 'users.db');
let db = null;

// Initialize the database and server
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.run(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        name TEXT,
        password TEXT,
        email TEXT
      )
    `);

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  } catch (error) {
    console.error('DB Error:', error.message);
    process.exit(1);
  }
};

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded; // Attach user info
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// User Registration API
app.post('/user/', async (req, res) => {
  const { username, name, password, email } = req.body;
  if (!username || !name || !password || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await db.get('SELECT * FROM user WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    await db.run(
      'INSERT INTO user (username, name, password, email) VALUES (?, ?, ?, ?)',
      [username, name, hashedPassword, email]
    );
    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error during user registration:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login API
app.post('/login/', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await db.get('SELECT * FROM user WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (isPasswordMatched) {
      const token = jwt.sign({ username }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: '1h',
      });
      res.json({ jwtToken: token });
    } else {
      res.status(400).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CRUD Profile API
app.route('/profile/')
  .get(authenticateJWT, async (req, res) => {
    try {
      const { username } = req.user;
      console.log(`Fetching profile for username: ${username}`); // Debugging log
      const user = await db.get('SELECT id, username, name, email FROM user WHERE username = ?', [
        username,
      ]);
      if (!user) {
        console.log('User not found.'); // Debugging log
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  .put(authenticateJWT, async (req, res) => {
    try {
      const { username } = req.user;
      const { name, email, password } = req.body;

      const fields = [];
      const values = [];
      if (name) fields.push('name = ?'), values.push(name);
      if (email) fields.push('email = ?'), values.push(email);
      if (password) fields.push('password = ?'), values.push(await bcrypt.hash(password, 10));
      values.push(username);

      await db.run(`UPDATE user SET ${fields.join(', ')} WHERE username = ?`, values);
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

initializeDBAndServer();
