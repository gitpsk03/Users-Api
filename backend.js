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

// Initialize the database and server
const initializeDBAndServer = async () => {
  try {
    console.log('Initializing database...');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Ensure the schema is initialized
    await initializeSchema();

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

// Create the database schema if not exists
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
  try {
    await db.run(createTableQuery);
    console.log('Database schema initialized successfully.');
  } catch (error) {
    console.error('Error initializing schema:', error);
  }
};

initializeDBAndServer();

// Helper function to log database state
const logDatabaseState = async () => {
  try {
    const users = await db.all('SELECT * FROM user;');
    console.log('Current Users in DB:', users);
  } catch (error) {
    console.error('Error logging database state:', error);
  }
};

// Register API
app.post('/user/', async (request, response) => {
  try {
    const { username, name, password, email } = request.body;

    // Input validation
    if (!username || !name || !password || !email) {
      return response.status(400).send('All fields are required');
    }

    if (password.length < 6) {
      return response.status(400).send('Password must be at least 6 characters long');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);

    const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO user (username, name, password, email)
        VALUES (?, ?, ?, ?);
      `;
      await db.run(createUserQuery, [username, name, hashedPassword, email]);
      console.log('User created successfully');
      await logDatabaseState(); // Log the database state after insertion
      response.send('User Created Successfully');
    } else {
      console.log('User already exists');
      response.status(400).send('User Already Exists');
    }
  } catch (error) {
    console.error('Error in user creation:', error);
    response.status(500).send('Internal Server Error');
  }
});

// Login API
app.post('/login/', async (request, response) => {
  try {
    const { username, password } = request.body;

    if (!username || !password) {
      return response.status(400).send('Username and password are required');
    }

    const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser === undefined) {
      response.status(400).send('Invalid User');
      return;
    }

    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      const payload = { username };
      const jwtToken = jwt.sign(payload, process.env.JWT_SECRET || 'default_secret');
      response.send({ jwtToken });
    } else {
      response.status(400).send('Invalid Password');
    }
  } catch (error) {
    console.error('Error in login:', error);
    response.status(500).send('Internal Server Error');
  }
});
