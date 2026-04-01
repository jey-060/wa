const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

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
`).catch((err) => {
  console.error('DB init error:', err);
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'start.html'));
});

app.post('/insult', async (req, res) => {
  const { username, password } = req.body;

  const usernameRegex = /^[a-zA-Z0-9]+$/;
  const specialRegex = /[!@#$%^&*(),.?":{}|<>]/;

  if (!usernameRegex.test(username)) {
    return res.status(400).send('아이디에는 영문과 숫자만 사용할 수 있습니다.');
  }

  if (!specialRegex.test(password)) {
    return res.status(400).send('비밀번호에 특수문자를 1개 이상 포함해야 합니다.');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    res.send('회원가입 완료');
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(400).send('이미 존재하는 아이디입니다.');
    }

    res.status(500).send('에러 발생');
  }
});


app.post('/rogin', async (req, res) => {
  const { username, password } = req.body;

  const usernameRegex = /^[a-zA-Z0-9]+$/;

  if (!usernameRegex.test(username)) {
    return res.status(400).send('아이디 형식이 올바르지 않습니다.');
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.send('로그인 실패');
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.send('로그인 실패');
    }

    req.session.user = {
      id: user.id,
      username: user.username
    };

    res.send('로그인 성공');
  } catch (err) {
    console.error(err);
    res.status(500).send('에러 발생');
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

app.listen(process.env.PORT || 3000, () => {
  console.log('Server started');
});
