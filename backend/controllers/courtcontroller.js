import { Court } from "../models/Court.js";
import { Reservation } from "../models/Reservation.js";
import { Student } from "../models/Student.js";

// Get available slots for all courts
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query; // from frontend query string ?date=2025-10-17

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // 1️⃣ Find all courts
    const courts = await Court.find();
    if (!courts.length) return res.status(404).json({ message: "No courts found" });

    // 2️⃣ Generate all possible 1-hour slots (9 AM to 9 PM)
    const allSlots = [];
    for (let hour = 9; hour < 21; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      allSlots.push(`${startTime}-${endTime}`);
    }

    // 3️⃣ Parse the date properly (avoid timezone issues)
    const [year, month, day] = date.split('-');
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    // 4️⃣ Get current hour if today
    const now = new Date();
    let currentHour = null;
    const isToday =
      now.getFullYear() === parseInt(year) &&
      now.getMonth() + 1 === parseInt(month) &&
      now.getDate() === parseInt(day);

    if (isToday) {
      currentHour = now.getHours();
    }

    // 5️⃣ Get courts with available slots
    const courtsWithAvailability = await Promise.all(
      courts.map(async (court) => {
        // Get existing reservations for this court on the selected date
        const reservations = await Reservation.find({
          court: court._id,
          date: { $gte: startDate, $lte: endDate },
        });

        const bookedSlots = reservations.map(r => r.timeSlot);

        // 6️⃣ Filter out both booked and past slots (if today)
        const availableSlots = allSlots.filter(slot => {
          const [startHour] = slot.split('-')[0].split(':').map(Number);

          // Remove past or current slots for today
          if (isToday && startHour <= currentHour) {
            return false;
          }

          return !bookedSlots.includes(slot);
        });

        return {
          _id: court._id,
          name: court.name,
          type: court.type,
          availableSlots,
        };
      })
    );

    res.json(courtsWithAvailability);
  } catch (err) {
    console.error("Error in getAvailableSlots:", err);
    res.status(500).json({ error: err.message });
  }
};
// Get available slots for a single court by numeric id
export const getAvailableSlotsByCourtId = async (req, res) => {
  try {
    const { id } = req.params; // e.g., /api/slots/court/1
    const { date } = req.query; // e.g., ?date=2025-10-17

    if (!id) return res.status(400).json({ message: "Court numeric ID is required" });
    if (!date) return res.status(400).json({ message: "Date is required" });

    // 1️⃣ Find the court by numeric id
    const court = await Court.findOne({ id: Number(id) });
    if (!court) return res.status(404).json({ message: `Court with id ${id} not found` });

    // 2️⃣ Generate all possible 1-hour slots (9 AM to 9 PM)
    const allSlots = [];
    for (let hour = 9; hour < 21; hour++) {
      const startTime = `${hour.toString().padStart(2, "0")}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;
      allSlots.push(`${startTime}-${endTime}`);
    }

    // 3️⃣ Parse the date properly
    const [year, month, day] = date.split("-");
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    // 4️⃣ Get current hour if today
    const now = new Date();
    let currentHour = null;
    const isToday =
      now.getFullYear() === parseInt(year) &&
      now.getMonth() + 1 === parseInt(month) &&
      now.getDate() === parseInt(day);

    if (isToday) currentHour = now.getHours();

    // 5️⃣ Get existing reservations for this court on the selected date
    const reservations = await Reservation.find({
      court: court._id,
      date: { $gte: startDate, $lte: endDate },
    });

    const bookedSlots = reservations.map((r) => r.timeSlot);

    // 6️⃣ Filter out booked and past slots (if today)
    const availableSlots = allSlots.filter((slot) => {
      const [startHour] = slot.split("-")[0].split(":").map(Number);

      if (isToday && startHour <= currentHour) return false;

      return !bookedSlots.includes(slot);
    });

    // 7️⃣ Return response
    res.json({
      court: {
        id: court.id,
        name: court.name,
        type: court.type,
      },
      availableSlots,
    });
  } catch (err) {
    console.error("Error in getAvailableSlotsByCourtId:", err);
    res.status(500).json({ error: err.message });
  }
};

// Reserve a court slot
export const reserveCourt = async (req, res) => {
  try {
    const { courtId, date, timeSlot } = req.body;
    const studentId = req.user.id; // From auth middleware

    if (!courtId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Court ID, date, and time slot are required' });
    }

    // Parse the date properly
    const [year, month, day] = date.split('-');
    const reservationDate = new Date(year, month - 1, day, 0, 0, 0);

    // 1️⃣ Check if slot is already booked
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);
    
    const existingReservation = await Reservation.findOne({
      court: courtId,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      timeSlot
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    // 2️⃣ Get student info to auto-include name and GUC ID
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // 3️⃣ Create reservation
    const reservation = new Reservation({
      court: courtId,
      student: studentId,
      date: reservationDate,
      timeSlot
    });

    await reservation.save();

    // 4️⃣ Populate the response with court and student info
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('court', 'name type')
      .populate('student', 'firstName lastName studentId');

    res.status(201).json({
      message: 'Court reserved successfully',
      reservation: populatedReservation
    });
  } catch (err) {
    console.error("Error in reserveCourt:", err);
    res.status(500).json({ error: err.message });
  }
};
// Reserve a court slot using numeric court id
export const reserveCourtByNumericId = async (req, res) => {
  try {
    const { courtId, date, timeSlot } = req.body; // courtId = numeric id
    const studentId = req.user.id; // From auth middleware

    if (!courtId || !date || !timeSlot) {
      return res.status(400).json({ message: "Court ID, date, and time slot are required" });
    }

    // 1️⃣ Find the court by numeric id
    const court = await Court.findOne({ id: Number(courtId) });
    if (!court) return res.status(404).json({ message: `Court with id ${courtId} not found` });

    // 2️⃣ Parse the date properly
    const [year, month, day] = date.split("-");
    const reservationDate = new Date(year, month - 1, day, 0, 0, 0);

    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    // 3️⃣ Check if slot is already booked
    const existingReservation = await Reservation.findOne({
      court: court._id, // use ObjectId internally
      date: { $gte: startDate, $lte: endDate },
      timeSlot,
    });

    if (existingReservation) {
      return res.status(400).json({ message: "This time slot is already booked" });
    }

    // 4️⃣ Get student info
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // 5️⃣ Create reservation
    const reservation = new Reservation({
      court: court._id, // internal ObjectId
      student: studentId,
      date: reservationDate,
      timeSlot,
    });

    await reservation.save();

    // 6️⃣ Populate the response
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate("court", "id name type")
      .populate("student", "firstName lastName studentId");

    res.status(201).json({
      message: "Court reserved successfully",
      reservation: populatedReservation,
    });
  } catch (err) {
    console.error("Error in reserveCourtByNumericId:", err);
    res.status(500).json({ error: err.message });
  }
};