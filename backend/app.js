import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from 'path';

// ===== IMPORT ALL MODELS FIRST =====
import "./models/Workshop.js";
import "./models/Trip.js";
import "./models/Bazaar.js";
import "./models/Confrence.js";
import "./models/RegisterBooth.js";
import "./models/RegisterBazaar.js";
import "./models/Wir.js";
import "./models/Student.js";
import "./models/Staff.js";
import "./models/EventOffice.js";
import "./models/Admin.js";
import "./models/Vendor.js";
import "./models/Notification.js";

// ADD THESE THREE LINES:
import "./models/Tournaments.js";
import "./models/Teams.js";
import "./models/SponsorshipApplication.js";

//Tournaments 
import eventOfficeTournamentRoutes from "./routes/eventOfficeTournamentRoutes.js"; // <-- NOW CORRECT
import studentTournamentRoutes from "./routes/studentTournamentRoutes.js";
import './models/Invitation.js';

// ===== THEN IMPORT HOOKS (CRITICAL ORDER) =====
import "./services/notificationHooks.js";

// ===== THEN IMPORT ROUTES =====
import eventGymroutes from "./routes/eventGymroutes.js";
import authroutes from "./routes/authroutes.js";
import vendorRoutesOne from "./routes/vendorRoutesOne.js";
import vendorRoutesTwo from "./routes/vendorRoutesTwo.js";
import adminroutes from "./routes/adminroutes.js";
import adminRestrauntRoutes from "./routes/adminRestrauntRoutes.js";
import restrauntRoutes from "./routes/Restrauntroutes.js";
import eventOfficeRoutes from "./routes/eventOfficeWorkshop.routes.js";
// import { handleStripeWebhook, handleStripeWebhookTrip} from "./controllers/paymentController.js";
import exportRoutes from "./routes/eventOfficeExportroutes.js";
//prof_R
import { requireAuth } from "./middlewares/authMiddleware.js";
import workshopRoutes from "./routes/workshopRoutes.js";
import eventBazaarroutes from "./routes/eventBazaarroutes.js";
import registerWorkshopRoutes from "./routes/registerWorkshoproutes.js";
import registerTriproutes from "./routes/registerTriproutes.js";
import myRegistrationsRoutes from "./routes/getRegistrationsroutes.js";
import conferenceRoutes from "./routes/conferenceRoutes.js";
import boothRoutes from "./routes/boothRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import vendorRequestsRoutes from "./routes/vendorRequestsRoutes.js";
import wirroutes from "./routes/wirroutes.js";
import courtroutes from "./routes/courtroutes.js";
import {
  getAllUsers,
  getAllVendors,
} from "./controllers/adminUsersController.js";
import eventOfficeQrRoutes from "./routes/eventOfficeQrRoutes.js";
import dummyRoutes from "./routes/dummyRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";

import rateandcommentrouts from "./routes/rateAndcommentroutes.js";
import favoritesRoutes from "./routes/favoritesRoutes.js";

import bazaarRoutes from "./routes/bazaarRoutes.js";
// app.js or server.js
import notificationPreferencesRoutes from "./routes/notificationPreferences.js";

import vendorTournamentRoutes from "./routes/vendorTournamentRoutes.js";
import vendorApplicationRoutes from "./routes/vendorApplicationRoutes.js";
import { isVendor } from "./middlewares/isVendor.js";
import invitationRoutes from './routes/invitationRoutes.js';


const app = express();


app.use(morgan("dev"));

// // ✅ STRIPE WEBHOOKS MUST COME BEFORE express.json()
//  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
//  app.use('/api/payments/webhook-trip', express.raw({ type: 'application/json' }), handleStripeWebhookTrip);

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/notification-preferences", notificationPreferencesRoutes);

app.use("/event-office2/externalqrs", eventOfficeQrRoutes);
app.get("/api/health", (req, res) => res.json({ ok: true }));

// expose combined users list for admin UI
app.get("/api/users", getAllUsers);
app.get("/api/vendorgetter", getAllVendors);

app.use("/eventOffice/gym", eventGymroutes);
app.use("/api/vendorOne", vendorRoutesOne);

app.use('/auth', authroutes);
app.use('/api/vendorTwo', vendorRoutesTwo);
app.use('/admin', adminroutes);
// Admin restaurant management (create / delete / list)
app.use('/', adminRestrauntRoutes);
// Restaurant owner routes (menu, items, orders)
app.use('/', restrauntRoutes);



app.use("/court", courtroutes);

app.use("/event-office/tournaments",requireAuth, eventOfficeTournamentRoutes); // <-- ADD THIS
// Student tournaments (view + register)
app.use("/api/student/tournaments", requireAuth, studentTournamentRoutes);


app.use("/api/admin", vendorRequestsRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/exports", exportRoutes);

app.use("/event-office", requireAuth, eventOfficeRoutes); // eventOffice workshops

app.use("/api/reports", reportsRoutes);

//prof_R
app.use("/api/professor/workshops", requireAuth, workshopRoutes);

app.use("/eventOffice/bazaars", eventBazaarroutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api", myRegistrationsRoutes);
app.use("/api/conferences", conferenceRoutes);
app.use("/api/booths", boothRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/bazaars", eventBazaarroutes);
// Mount registration routes for trips
app.use("/api/trips", registerTriproutes);
app.use("/api/workshops", registerWorkshopRoutes);

app.use("/api/wir", wirroutes);

app.use("/api/ratecomment", rateandcommentrouts);
app.use("/api/notifications", notificationRoutes);
app.use("/api/favorites", favoritesRoutes);

app.use("/dummy", dummyRoutes);

app.use("/bazaarbyid", bazaarRoutes);

// Vendor Tournament and Sponsorship Routes
app.use("/api/vendor/tournaments", requireAuth, isVendor, vendorTournamentRoutes);
app.use("/api/vendor/applications", requireAuth, isVendor, vendorApplicationRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/invitations', invitationRoutes);


// Not found
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server Error" });
});

app.get("/test-notification", async (req, res) => {
  const { EventOffice } = await import("./models/EventOffice.js");
  const { Notification } = await import("./models/Notification.js");

  // Check if EventOffice users exist
  const eventOffices = await EventOffice.find({ status: "Active" });
  console.log("Event Office users found:", eventOffices.length);
  console.log(
    "Event Office IDs:",
    eventOffices.map((e) => e._id)
  );

  // Try to create a notification manually
  const testNotif = await Notification.create({
    recipientType: "EventOffice",
    recipientId: eventOffices[0]._id,
    type: "workshop_request",
    title: "TEST",
    message: "TEST MESSAGE",
  });

  console.log("Test notification created:", testNotif);

  res.json({
    eventOfficeCount: eventOffices.length,
    notification: testNotif,
  });
});

export default app;
