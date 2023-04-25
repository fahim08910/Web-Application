import express from 'express';
import db from '../db/db.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const stmt = db.prepare('SELECT * FROM poi_users WHERE username = ? AND password = ?');
  const result = stmt.all(username, password);
  if(result.length == 1) {
    req.session.username = username;
    res.json({"username": username});
  } else {
    res.status(401).json({error: "Incorrect login!"});
  } 
});

router.post('/logout', (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.log(err);
        res.status(500).json({error: "Internal Server Error"});
      } else {
        res.json({ redirect: '/login' });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

router.get('/login', (req, res) => {
  res.json({username: req.session.username || null} );
});

export default router;
