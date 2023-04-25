import express from 'express';
import db from '../db/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authMiddleware from '../middleware/authMiddleware.js';
import permissionMiddleware from '../middleware/permissionMiddleware.js';

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const upload = multer({ dest: uploadDir });

router.post('/:id/photos', authMiddleware, permissionMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const poiId = req.params.id;
    const loggedIn = req.session.username ? true : false;

    if (!loggedIn) {
      res.status(401).send('Not authorized');
      return;
    }

    const poi = await db.get('SELECT * FROM pointsofinterest WHERE id = ?', poiId);
    if (!poi) {
      res.status(404).send('POI not found');
      return;
    }

    if (!req.file) {
      res.status(400).send('No file uploaded');
      return;
    }

    const fileName = req.file.filename;
    const filePath = path.join(uploadDir, fileName);
    const fileMimeType = req.file.mimetype;

    // Check that uploaded file is an image
    if (!fileMimeType.startsWith('image/')) {
      fs.unlinkSync(filePath);
      res.status(400).send('Invalid file type');
      return;
    }

    // Save photo to database and update POI
    const photoId = await addPhotoToPOI(poi, filePath, fileName);

    res.status(201).json({
      message: 'Photo uploaded successfully',
      id: photoId,
      poiId: poiId,
      filePath: filePath,
      fileName: fileName
    });
  } catch (error) {
    console.error(`Error uploading photo: ${error.message}`);
    res.status(500).send('Error uploading photo');
  }
});

async function addPhotoToPOI(poi, filePath, fileName) {
  // Save photo to database
  const result = await db.query('INSERT INTO photos (poi_id, file_name) VALUES (?, ?)', poi.id, fileName);
  const photoId = result.insertId;

  // Update POI with photo
  await db.query('UPDATE pointsofinterest SET photo_id = ? WHERE id = ?', photoId, poi.id);

  return photoId;
}

export default router;
