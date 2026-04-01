const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.json());

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

const bcrypt = require('bcrypt');
const helmet = require('helmet');

app.use(helmet());
cookie: {
  httpOnly: true,
  secure: true
}
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


// ✅ 회원가입 (bcrypt 적용)
app.post('/insult', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    res.send('회원가입 완료');
  } catch (err) {
    res.status(500).send('에러 발생');
  }
});


// ✅ 로그인 (bcrypt 비교 방식)
app.post('/rogin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username=$1',
      [username]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        req.session.user = {
          id: user.id,
          username: user.username
        };
        return res.send('로그인 성공');
      }
    }

    res.send('로그인 실패');
  } catch (err) {
    res.status(500).send('에러 발생');
  }
});


// ✅ 프로필 (세션 확인)
app.get('/profil', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('not logged in');
  }

  res.json({
    username: req.session.user.username
  });
});


app.listen(process.env.PORT || 3000);
const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.json());

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

const bcrypt = require('bcrypt');
const helmet = require('helmet');

app.use(helmet());

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


// ✅ 회원가입 (bcrypt 적용)
app.post('/insult', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    res.send('회원가입 완료');
  } catch (err) {
    res.status(500).send('에러 발생');
  }
});


// ✅ 로그인 (bcrypt 비교 방식)
app.post('/rogin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username=$1',
      [username]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        req.session.user = {
          id: user.id,
          username: user.username
        };
        return res.send('로그인 성공');
      }
    }

    res.send('로그인 실패');
  } catch (err) {
    res.status(500).send('에러 발생');
  }
});


// ✅ 프로필 (세션 확인)
app.get('/profil', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('not logged in');
  }

  res.json({
    username: req.session.user.username
  });
});


app.listen(process.env.PORT || 3000);