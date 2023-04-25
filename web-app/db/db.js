import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import path from 'path'; // add this line

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'pointsofinterest.db');
const db = new Database(dbPath);

export default db;
