const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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

const db = new sqlite3.Database('./users.db');

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  password TEXT
)
`);

const path = require('path');

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'start.html'));
});

app.post('/insult', (req, res) => {
  const { username, password } = req.body;
  db.run('INSERT INTO users (username, password) VALUES (?, ?)',
    [username, password],
    () => res.send('회원가입 완료')
  );
});

app.post('/rogin', (req, res) => {
  const { username, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE username=? AND password=?',
    [username, password],
    (err, user) => {
      if (user) {
        req.session.user = user;
        res.send('로그인 성공');
      } else {
        res.send('로그인 실패');
      }
    }
  );
});

app.get('/profil', (req, res) => {
  if (!req.session.user) {
    return res.send('로그인 필요');
  }

  res.json({ username: req.session.user.username });
});

app.listen(3000, () => {
  console.log('http://localhost:3000');
});