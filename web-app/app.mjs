import express from 'express';
import session from 'express-session';
import betterSqlite3Session from 'express-session-better-sqlite3';
import authRouter from './routes/auth.js';
import poiRouter from './routes/poi.js';
import reviewRouter from './routes/review.js';
import fileUploadRouter from './routes/fileupload.js';
import sessDb from './db/sessionDb.js';

const SqliteStore = betterSqlite3Session(session, sessDb);

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false,
  store: new SqliteStore(),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: false // allow client-side access to cookie
  }
}));

app.use(authRouter);
app.use(poiRouter);
app.use(reviewRouter);
app.use(fileUploadRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 4200;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
