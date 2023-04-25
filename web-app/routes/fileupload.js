import express from 'express';
import db from '../db/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authMiddleware from '../middleware/authMiddleware.js';
import permissionMiddleware from '../middleware/permissionMiddleware.js';
import { parse } from 'csv-parse';

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

    const csvFilePath = path.join(uploadDir, 'photos.csv');
    const photoIds = await addPhotosToDatabase(poiId, filePath, fileName, csvFilePath);

    res.status(201).json({
      message: 'Photos uploaded successfully',
      photoIds: photoIds
    });
  } catch (error) {
    console.error(`Error uploading photos: ${error.message}`);
    res.status(500).send('Error uploading photos');
  }
});

async function addPhotosToDatabase(poiId, filePath, fileName, csvFilePath) {
  // Read data from the CSV file
  const csvData = await fs.promises.readFile(csvFilePath, 'utf-8');
  const records = parse(csvData, { columns: true });

}

export default router;
