// Import required modules
const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Ensure 'cors' is installed with `npm install cors`
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies

// Configure CORS
app.use(
  cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  })
);

// Define database path
const dbPath = path.join(__dirname, 'users.db');
let db = null;

// Initialize database and server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/');
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Middleware to authenticate JWT token
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers['authorization'];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send('Invalid Access Token');
  } else {
    jwt.verify(jwtToken, process.env.JWT_SECRET || 'aafSSCsz', async (error, payload) => {
      if (error) {
        response.status(401).send('Invalid Access Token');
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

// API to register a new user
app.post('/user/', async (request, response) => {
  const { username, name, password, email } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, email) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${email}'
        )`;
    const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    response.send(`Created new user with ID: ${newUserId}`);
  } else {
    response.status(400).send('User already exists');
  }
});

// API to log in a user and generate a JWT token
app.post('/login/', async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400).send('Invalid User');
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, process.env.JWT_SECRET || 'aafSSCsz');
      response.send({ jwtToken });
    } else {
      response.status(400).send('Invalid Password');
    }
  }
});

// API to get user profile
app.get('/profile/', authenticateToken, async (request, response) => {
  const { username } = request;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const userDetails = await db.get(selectUserQuery);
  response.send(userDetails);
});
