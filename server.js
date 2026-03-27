const express = require('express');
const session = require('express-session');


const app = express();
app.use(express.json());


app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
  
}));
const cors = require('cors');
app.use(cors({
  origin: true,
  credentials: true
}));
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT
)
`);

const path = require('path');

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'start.html'));
});

app.post('/insult', async (req, res) => {
  const { username, password } = req.body;

  try {
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, password]
    );

    res.send('회원가입 완료');
  } catch (err) {
    res.status(500).send('에러 발생');
  }
});

app.post('/rogin', async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE username=$1 AND password=$2',
    [username, password]
  );

  if (result.rows.length > 0) {
    req.session.user = result.rows[0];
    res.send('로그인 성공');
  } else {
    res.send('로그인 실패');
  }
});

app.get('/profil', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('not logged in');
  }

  res.json({
    username: req.session.user.username
  });
});


app.listen(process.env.PORT || 3000);
;