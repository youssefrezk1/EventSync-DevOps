import cron from 'node-cron';
import { Workshop } from '../models/Workshop.js';
import { Trip } from '../models/Trip.js';
import { Bazaar } from '../models/Bazaar.js';
import { RegisterBooth } from '../models/RegisterBooth.js';
import { sendEventReminders } from '../controllers/notificationController.js';

// Helper function to check if event is in timeframe
const isInTimeframe = (eventDate, hours) => {
  const now = new Date();
  const targetTime = new Date(eventDate);
  const diffInHours = (targetTime - now) / (1000 * 60 * 60);
  
  // Check if within a 5-minute window of the target time
  return diffInHours > (hours - 0.1) && diffInHours <= (hours + 0.1);
};

// Run every 5 minutes to check for events needing reminders
export const startReminderScheduler = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running event reminder check...');
    
    try {
      const now = new Date();
      
      // Find upcoming workshops
      const upcomingWorkshops = await Workshop.find({
        start: { 
          $gte: now, 
          $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000) // 25 hours window
        },
        status: 'confirmed',
        isArchived: false,
      });

      // Find upcoming trips
      const upcomingTrips = await Trip.find({
        start: { 
          $gte: now, 
          $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000)
        },
        isArchived: false,
      });

      // Find upcoming bazaars
      const upcomingBazaars = await Bazaar.find({
        start: { 
          $gte: now, 
          $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000)
        },
        isArchived: false,
      });

      // Find upcoming booths (accepted and starting soon)
      const upcomingBooths = await RegisterBooth.find({
        StartDate: { 
          $gte: now, 
          $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000)
        },
        Pending: 'Accept',
      });

      // Process workshops
      for (const workshop of upcomingWorkshops) {
        if (isInTimeframe(workshop.start, 24)) {
          console.log(`Sending 1-day reminder for workshop: ${workshop.name}`);
          await sendEventReminders(workshop, 'Workshop', '1 day');
        } else if (isInTimeframe(workshop.start, 1)) {
          console.log(`Sending 1-hour reminder for workshop: ${workshop.name}`);
          await sendEventReminders(workshop, 'Workshop', '1 hour');
        }
      }

      // Process trips
      for (const trip of upcomingTrips) {
        if (isInTimeframe(trip.start, 24)) {
          console.log(`Sending 1-day reminder for trip: ${trip.name}`);
          await sendEventReminders(trip, 'Trip', '1 day');
        } else if (isInTimeframe(trip.start, 1)) {
          console.log(`Sending 1-hour reminder for trip: ${trip.name}`);
          await sendEventReminders(trip, 'Trip', '1 hour');
        }
      }

      // Process bazaars
      for (const bazaar of upcomingBazaars) {
        if (isInTimeframe(bazaar.start, 24)) {
          console.log(`Sending 1-day reminder for bazaar: ${bazaar.name}`);
          await sendEventReminders(bazaar, 'Bazaar', '1 day');
        } else if (isInTimeframe(bazaar.start, 1)) {
          console.log(`Sending 1-hour reminder for bazaar: ${bazaar.name}`);
          await sendEventReminders(bazaar, 'Bazaar', '1 hour');
        }
      }

      // Process booths
      for (const booth of upcomingBooths) {
        if (isInTimeframe(booth.StartDate, 24)) {
          console.log(`Sending 1-day reminder for booth at: ${booth.Location}`);
          await sendEventReminders(booth, 'RegisterBooth', '1 day');
        } else if (isInTimeframe(booth.StartDate, 1)) {
          console.log(`Sending 1-hour reminder for booth at: ${booth.Location}`);
          await sendEventReminders(booth, 'RegisterBooth', '1 hour');
        }
      }

    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  });

  console.log('✅ Event reminder scheduler started (runs every 5 minutes)');
};