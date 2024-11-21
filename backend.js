const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const bcrypt = require('bcrypt')
const sqlite3 = require('sqlite3')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'users.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// Register API
app.post('/user/', async (request, response) => {
  const {username, name, password, email} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}'
  `
  const dbUser = await db.get(selectUserQuery)

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
    );`
    await db.run(createUserQuery)
    response.send('User Created Successfully')
  } else {
    response.status(400)
    response.send('User Already Exists')
  }
})

// login API
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
  SELECT * FROM user WHERE username = '${username}'
  `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {username}
      const jwtToken = jwt.sign(payload, 'newstring')
      response.send(jwtToken)
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})
