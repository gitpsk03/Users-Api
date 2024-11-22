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

// Temporary CORS configuration to allow all origins for testing
app.use(
  cors({
    origin: '*', // Allow all origins temporarily to test
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const dbPath = path.join(__dirname, 'users.db');
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Initialize the database schema
    await initializeSchema();

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/');
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

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

initializeDBAndServer();

// Register API
app.post('/user/', async (request, response) => {
  const { username, name, password, email } = request.body;

  if (!password || password.length < 6) {
    response.status(400);
    response.send('Password must be at least 6 characters long');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
  const dbUser = await db.get(selectUserQuery, [username]);

  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO user (username, name, password, email)
      VALUES (?, ?, ?, ?);
    `;
    await db.run(createUserQuery, [username, name, hashedPassword, email]);
    response.send('User Created Successfully');
  } else {
    response.status(400);
    response.send('User Already Exists');
  }
});

// Login API
app.post('/login/', async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
  const dbUser = await db.get(selectUserQuery, [username]);

  if (dbUser === undefined) {
    response.status(400);
    response.send('Invalid User');
    return;
  }

  const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
  if (isPasswordMatched) {
    const payload = { username };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET || 'default_secret');
    response.send({ jwtToken });
  } else {
    response.status(400);
    response.send('Invalid Password');
  }
});
