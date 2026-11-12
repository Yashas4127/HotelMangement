import app from './app.js';
import { connectDatabase } from './config/db.js';

let databaseConnection;

export default async function handler(req, res) {
  if (!databaseConnection) {
    databaseConnection = connectDatabase().catch((error) => {
      databaseConnection = undefined;
      throw error;
    });
  }

  await databaseConnection;
  return app(req, res);
}
