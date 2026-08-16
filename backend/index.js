import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { connectDB } from './config/db.js';
import { startReminderScheduler } from './services/reminderScheduler.js';


const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await connectDB();

    startReminderScheduler();

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}
bootstrap();
