// routes/eventOfficeTournamentRoutes.js

import { Router } from 'express'; // Use this style for express router
import { 
    createTournament, 
    getAllTournaments, 
    getTournamentById, 
    updateTournament, 
    deleteTournament,
    getTeamsByTournament,
    updateTeamStatus,
    viewPendingSponsorApplications,
    manageSponsorshipApplication
} from '../controllers/tournamentsController.js'; // <-- Named imports from controller



const router = Router();

// NO NEED TO IMPORT OR USE MIDDLEWARE HERE. 
// We rely on the middleware applied in app.js on the mounting path:
// app.use("/event-office/tournaments", requireAuth, isEventOffice, eventOfficeTournamentRoutes);

// --- Tournament CRUD Routes ---

router.route('/')
    .post(createTournament) // <-- USE DIRECTLY
    .get(getAllTournaments); // <-- USE DIRECTLY

// GET/PUT/DELETE /event-office/tournaments/:id 
router.route('/:id')
    .get(getTournamentById) // <-- USE DIRECTLY
    .put(updateTournament) // <-- USE DIRECTLY
    .delete(deleteTournament); // <-- USE DIRECTLY

// --- Team Management Routes ---
router.get('/:tournamentId/teams', getTeamsByTournament); // <-- USE DIRECTLY
router.put('/teams/:teamId/status', updateTeamStatus); // <-- USE DIRECTLY

// --- Sponsorship Management Routes ---
router.get('/sponsorships/pending', viewPendingSponsorApplications); // <-- USE DIRECTLY
router.put('/sponsorships/:applicationId/status', manageSponsorshipApplication); // <-- USE DIRECTLY

export default router;