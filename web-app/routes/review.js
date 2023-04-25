
import express from 'express';
import db from '../db/db.js';
import authMiddleware from '../middleware/authMiddleware.js';
import permissionMiddleware from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.post('/points-of-interest/:id/reviews', authMiddleware,permissionMiddleware, (req, res) => {
  const poiId = req.params.id;
  const review = req.body.review;

  const poi = db.prepare('SELECT * FROM pointsofinterest WHERE id = ?').get(poiId);
  if (!poi) {
    res.status(404).send('POI not found');
    return;
  }

  if (!review || review.trim() === '') {
    res.status(400).send('Review text cannot be blank');
    return;
  }

  const result = db.prepare('INSERT INTO poi_reviews (poi_id, review) VALUES (?, ?)')
    .run(poiId, review);

  if (result.changes === 1) {
    res.status(201).send('Review added successfully');
  } else {
    console.error('Error adding review:', result.error);
    res.status(500).send('Error adding review');
  }
});

export default router;
