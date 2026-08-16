// routes/studentTournamentRoutes.js
import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  getAllTournamentsForStudent,
  getTournamentDetails,
  registerForTournament,
  getRegisteredTournamentsForStudent,
  cancelRegistration,
  payForTournament,
  verifyTournamentPayment
} from "../controllers/studentTournamentController.js";

const router = express.Router();

// GET all available tournaments (with filtering/search)
router.get("/", requireAuth, getAllTournamentsForStudent);

// GET verify tournament payment (must be before /:id to avoid conflict)
router.get("/verify-payment", requireAuth, verifyTournamentPayment);

// GET my registered tournaments
router.get("/registered/me", requireAuth, getRegisteredTournamentsForStudent);

// GET single tournament details
router.get("/:id", requireAuth, getTournamentDetails);

// POST register for tournament
router.post("/:id/register", requireAuth, registerForTournament);

// POST pay for tournament
router.post("/:teamId/pay", requireAuth, payForTournament);

// DELETE cancel registration
router.delete("/:id/cancel", requireAuth, cancelRegistration);

export default router;