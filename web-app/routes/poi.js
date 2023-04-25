import express from 'express';
import path from 'path';
import db from '../db/db.js';
import authMiddleware from '../middleware/authMiddleware.js';
import permissionMiddleware from '../middleware/permissionMiddleware.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));



const router = express.Router();

router.get('/add', authMiddleware, permissionMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'add.html'));
});



router.get('/points-of-interest/:region', authMiddleware, (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM pointsofinterest WHERE region=?");
    const results = stmt.all(req.params.region);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

router.post('/points-of-interest/create', authMiddleware,permissionMiddleware, (req, res) => {
  const name = req.body.name;
  const type = req.body.type;
  const country = req.body.country;
  const region = req.body.region;
  const lon = req.body.lon;
  const lat = req.body.lat;
  const description = req.body.description;

  if (!name) {
    res.status(400).json({ error: 'Name field is missing.' });
    return;
  }

  if (!type) {
    res.status(400).json({ error: 'Type field is missing.' });
    return;
    }
    
    if (!country) {
    res.status(400).json({ error: 'Country field is missing.' });
    return;
    }
    
    if (!region) {
    res.status(400).json({ error: 'Region field is missing.' });
    return;
    }
    
    if (!lon) {
    res.status(400).json({ error: 'Longitude field is missing.' });
    return;
    }
    
    if (!lat) {
    res.status(400).json({ error: 'Latitude field is missing.' });
    return;
    }
    
    if (!description) {
    res.status(400).json({ error: 'Description field is missing.' });
    return;
    }
    
    try {
    const stmt = db.prepare('INSERT INTO pointsofinterest(name, type, country, region, lon, lat, description, recommendations) VALUES (?, ?, ?, ?, ?, ?, ?, 0)');
    const result = stmt.run(name, type, country, region, lon, lat, description);
    res.json({ id: result.lastInsertRowid });
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
    }
    });
    
    router.post('/points-of-interest/:id/recommend', authMiddleware, (req, res) => {
    try {
    const stmt = db.prepare('UPDATE pointsofinterest SET recommendations = recommendations + 1 WHERE id = ?');
    const result = stmt.run(req.params.id);
    if(result.changes == 1) {
    res.json({success:1});
    } else {
    res.status(404).json({error: 'No product with that ID'});
    }
    } catch(error) {
    res.status(500).json({error: error});
    }
    });
    
    export default router;