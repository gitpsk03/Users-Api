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
    const port = process.env.PORT || 3000; // Dynamic port assignment
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`);
    });
  } catch (e) {
    console.error(`DB Error: ${e.message}`);
    process.exit(1); // Exit if the database connection fails
  }
};
initializeDBAndServer();

// Middleware to authenticate JWT token
const authenticateToken = (request, response, next) => {
  const authHeader = request.headers['authorization'];
  if (authHeader) {
    const jwtToken = authHeader.split(' ')[1];
    jwt.verify(jwtToken, process.env.JWT_SECRET || 'aafSSCsz', (error, payload) => {
      if (error) {
        response.status(401).send('Invalid Access Token');
      } else {
        request.username = payload.username;
        next();
      }
    });
  } else {
    response.status(401).send('Authorization header is missing');
  }
};

// API to register a new user (Create)
app.post('/user/', async (request, response) => {
  try {
    const { username, name, password, email } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username = ?`;
    const dbUser = await db.get(selectUserQuery, [username]);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          user (username, name, password, email) 
        VALUES 
          (?, ?, ?, ?)`;
      const dbResponse = await db.run(createUserQuery, [username, name, hashedPassword, email]);
      response.send(`Created new user with ID: ${dbResponse.lastID}`);
    } else {
      response.status(400).send('User already exists');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    response.status(500).send('Internal Server Error');
  }
});

// API to log in a user and generate a JWT token
app.post('/login/', async (request, response) => {
  try {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE username = ?`;
    const dbUser = await db.get(selectUserQuery, [username]);
    if (dbUser === undefined) {
      response.status(400).send('Invalid User');
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatched) {
        const payload = { username: username };
        const jwtToken = jwt.sign(payload, process.env.JWT_SECRET || 'aafSSCsz');
        response.send({ jwtToken });
      } else {
        response.status(400).send('Invalid Password');
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    response.status(500).send('Internal Server Error');
  }
});

// API to get user profile (Read)
app.get('/profile/', authenticateToken, async (request, response) => {
  try {
    const { username } = request;
    const selectUserQuery = `SELECT * FROM user WHERE username = ?`;
    const userDetails = await db.get(selectUserQuery, [username]);
    if (userDetails) {
      response.send(userDetails);
    } else {
      response.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    response.status(500).send('Internal Server Error');
  }
});

// API to update user profile (Update)
app.put('/profile/', authenticateToken, async (request, response) => {
  try {
    const { username } = request;
    const { name, email, password } = request.body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const updateQuery = hashedPassword
      ? `UPDATE user SET name = ?, email = ?, password = ? WHERE username = ?`
      : `UPDATE user SET name = ?, email = ? WHERE username = ?`;

    const updateParams = hashedPassword ? [name, email, hashedPassword, username] : [name, email, username];

    const dbResponse = await db.run(updateQuery, updateParams);
    if (dbResponse.changes > 0) {
      response.send('Profile updated successfully!');
    } else {
      response.status(400).send('Profile update failed.');
    }
  } catch (error) {
    console.error('Error updating profile:', error.message);
    response.status(500).send('Internal Server Error');
  }
});

// API to delete user profile (Delete)
app.delete('/profile/', authenticateToken, async (request, response) => {
  try {
    const { username } = request;
    const deleteQuery = `DELETE FROM user WHERE username = ?`;
    const dbResponse = await db.run(deleteQuery, [username]);

    if (dbResponse.changes > 0) {
      response.send('Profile deleted successfully!');
    } else {
      response.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error deleting profile:', error.message);
    response.status(500).send('Internal Server Error');
  }
});

