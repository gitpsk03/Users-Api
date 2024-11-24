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

// CORS configuration
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
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await initializeSchema();

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`);
    });
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

// Create the database schema
const initializeSchema = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      name TEXT,
      password TEXT,
      email TEXT
    );
  `;
  await db.run(createTableQuery);
};

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded; // Attach user info to the request
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    res.status(401).send('Invalid token');
  }
};

// Register API
app.post('/user/', async (req, res) => {
  try {
    const { username, name, password, email } = req.body;
    if (!username || !name || !password || !email) {
      return res.status(400).send('All fields are required');
    }
    if (password.length < 6) {
      return res.status(400).send('Password must be at least 6 characters long');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const dbUser = await db.get('SELECT * FROM user WHERE username = ?', [username]);
    if (dbUser) {
      return res.status(400).send('User Already Exists');
    }

    await db.run(
      'INSERT INTO user (username, name, password, email) VALUES (?, ?, ?, ?)',
      [username, name, hashedPassword, email]
    );
    res.send('User Created Successfully');
  } catch (error) {
    console.error('Error in user creation:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Login API
app.post('/login/', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    const dbUser = await db.get('SELECT * FROM user WHERE username = ?', [username]);
    if (!dbUser) {
      return res.status(400).send('Invalid User');
    }

    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      const payload = { username };
      const jwtToken = jwt.sign(payload, process.env.JWT_SECRET || 'default_secret');
      res.send({ jwtToken });
    } else {
      res.status(400).send('Invalid Password');
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Profile API
app.route('/profile/')
  .get(authenticateJWT, async (req, res) => {
    try {
      const { username } = req.user;
      const user = await db.get(
        'SELECT id, username, name, email FROM user WHERE username = ?',
        [username]
      );
      if (!user) {
        return res.status(404).send('User not found');
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).send('Internal Server Error');
    }
  })
  .put(authenticateJWT, async (req, res) => {
    try {
      const { username } = req.user;
      const { name, email, password } = req.body;

      if (!name && !email && !password) {
        return res.status(400).send('At least one field (name, email, password) is required');
      }

      const updateFields = [];
      const values = [];

      if (name) {
        updateFields.push('name = ?');
        values.push(name);
      }
      if (email) {
        updateFields.push('email = ?');
        values.push(email);
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password = ?');
        values.push(hashedPassword);
      }

      values.push(username);

      const query = `UPDATE user SET ${updateFields.join(', ')} WHERE username = ?`;
      await db.run(query, values);

      res.send('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send('Internal Server Error');
    }
  });


// Start server
initializeDBAndServer();
