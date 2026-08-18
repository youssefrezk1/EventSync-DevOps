"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle, X, Loader2, Mouse, Hand } from "lucide-react";

interface Court {
  id: number;
  name: string;
  description: string;
  points: { x: number; y: number }[];
}

const courts: Court[] = [
  {
    id: 1,
    name: "Tennis Court 1",
    description: "Synthetic surface with night lighting and audience stands.",
    points: [
      { x: 51, y: 69 },
      { x: 48.6, y: 69.1 },
      { x: 48.6, y: 81 },
      { x: 51, y: 81 },
    ],
  },
  {
    id: 2,
    name: "Tennis Court 2",
    description: "Acrylic flooring, near the main gym building.",
    points: [
      { x: 45.3, y: 69.3 },
      { x: 48, y: 69.3 },
      { x: 48, y: 81.5 },
      { x: 45.3, y: 81.5 },
    ],
  },
  {
    id: 3,
    name: "VolleyBall Field 1",
    description: "Full-size turf field with stadium seating.",
    points: [
      { x: 45.5, y: 48.6 },
      { x: 41.9, y: 48.6 },
      { x: 41.9, y: 63.5 },
      { x: 45.5, y: 63.5 },
    ],
  },
  {
    id: 4,
    name: "VolleyBall Field 2",
    description: "Full-size turf field with stadium seating.",
    points: [
      { x: 41.3, y: 48.9 },
      { x: 37.8, y: 48.9 },
      { x: 37.8, y: 62.9 },
      { x: 41.3, y: 62.9 },
    ],
  },
  {
    id: 5,
    name: "Football Field",
    description: "Full-size turf field with stadium seating.",
    points: [
      { x: 53, y: 40 },
      { x: 64, y: 29 },
      { x: 75, y: 71 },
      { x: 64.5, y: 86 },
    ],
  },
  {
    id: 6,
    name: "Handball Field 1",
    description: "Full-size turf field with stadium seating.",
    points: [
      { x: 37, y: 73.4 },
      { x: 34.7, y: 73.4 },
      { x: 34.7, y: 81.8 },
      { x: 37, y: 81.8 },
    ],
  },
  {
    id: 7,
    name: "Handball Field 2",
    description: "Full-size turf field with stadium seating.",
    points: [
      { x: 34.3, y: 74.3 },
      { x: 31.5, y: 74.3 },
      { x: 31.5, y: 82.1 },
      { x: 34.3, y: 82.1 },
    ],
  },
  {
    id: 8,
    name: "BasketBall Field 1",
    description: "Full-size turf field with stadium seating.",
    points: [
      { x: 44.2, y: 71.2 },
      { x: 41.4, y: 71.2 },
      { x: 41.4, y: 81.7 },
      { x: 44.2, y: 81.7 },
    ],
  },
  {
    id: 9,
    name: "BasketBall Field 2",
    description: "Full-size turf field with stadium seating.",
    points: [
      { x: 41, y: 71.1 },
      { x: 37.8, y: 71.1 },
      { x: 37.8, y: 81.9 },
      { x: 41, y: 81.9 },
    ],
  },
  {
    id: 10,
    name: "Green Tennis",
    description: "Full-size turf field with stadium seating.",
    points: [
      { x: 33.8, y: 52.1 },
      { x: 37, y: 52.1 },
      { x: 37, y: 63.2 },
      { x: 33.8, y: 63.2 },
    ],
  },
];

export default function CourtMap() {
  const [selected, setSelected] = useState<Court | null>(null);
  const [hoveredCourt, setHoveredCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
  }, []);

  useEffect(() => {
    if (selected && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selected, selectedDate]);

  const filterFutureSlots = (slots: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (selectedDate !== today) {
      return slots;
    }

    const currentHour = new Date().getHours();

    return slots.filter(slot => {
      const startTime = slot.split('-')[0].trim();
      const slotHour = parseInt(startTime.split(':')[0]);
      return slotHour > currentHour;
    });
  };

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/court/availablebycourt/${selected!.id}?date=${selectedDate}`
      );
      const data = await response.json();
      const filteredSlots = filterFutureSlots(data.availableSlots || []);
      setAvailableSlots(filteredSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = async () => {
    if (!selectedSlot || !selected || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("/court/reserveCourtByNumericId", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          courtId: selected.id,
          date: selectedDate,
          timeSlot: selectedSlot,
        }),
      });

      if (response.ok) {
        setBookingSuccess(true);
        fetchAvailableSlots();
      } else {
        const error = await response.json();
        alert(error.message || "Booking failed");
      }
    } catch (error) {
      console.error("Error booking court:", error);
      alert("Failed to book court. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scalePolygon = (points: { x: number; y: number }[], scale: number) => {
    const centroid = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    centroid.x /= points.length;
    centroid.y /= points.length;
    return points.map((p) => ({
      x: centroid.x + (p.x - centroid.x) * scale,
      y: centroid.y + (p.y - centroid.y) * scale,
    }));
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="relative w-full h-screen bg-white">
      {/* Background map */}
      <div className="relative w-full h-[90vh] overflow-hidden" style={{ perspective: "1000px" }}>
        <img
          src="/images/map.png"
          alt="Court Map"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        />

        {/* Interactive Instructions - Positioned on top LEFT of image */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg border border-purple-200"
          >
            <Mouse size={20} className="text-purple-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Hover over a field</p>
              <p className="text-xs text-gray-600">See court details instantly</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg border border-pink-200"
          >
            <Hand size={20} className="text-pink-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Click to book</p>
              <p className="text-xs text-gray-600">Choose your time slot</p>
            </div>
          </motion.div>
        </div>

        {/* Dark overlay when popup is open */}
        <motion.div
          className="absolute inset-0 bg-black pointer-events-none"
          animate={{ opacity: selected ? 0.5 : 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* Court outlines */}
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {courts.map((court) => {
            const isSelected = selected?.id === court.id;
            const isHovered = hoveredCourt?.id === court.id;

            return (
              <motion.g
                key={court.id}
                onMouseEnter={() => setHoveredCourt(court)}
                onMouseLeave={() => setHoveredCourt(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(isSelected ? null : court);
                }}
                style={{ cursor: "pointer" }}
              >
                <motion.polygon
                  points={court.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="#93c7c1"
                  strokeWidth="0.25"
                  strokeLinejoin="round"
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{
                    opacity: isHovered || isSelected ? 1 : 0,
                    pathLength: isHovered || isSelected ? 1 : 0,
                  }}
                  transition={{
                    opacity: { duration: 0.2 },
                    pathLength: { duration: 0.6, ease: "easeOut" },
                  }}
                />

                <motion.polygon
                  points={scalePolygon(court.points, 1.05)
                    .map((p) => `${p.x},${p.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="#003d52"
                  strokeWidth="0.25"
                  strokeLinejoin="round"
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{
                    opacity: isHovered || isSelected ? 1 : 0,
                    pathLength: isHovered || isSelected ? 1 : 0,
                  }}
                  transition={{
                    opacity: { duration: 0.2, delay: 0.15 },
                    pathLength: { duration: 0.6, ease: "easeOut", delay: 0.15 },
                  }}
                />

                <motion.polygon
                  points={court.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="rgba(147, 199, 193, 0.15)"
                  stroke="none"
                  animate={{ opacity: isSelected ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.g>
            );
          })}
        </svg>

        {/* Hover labels */}
        {courts.map((court) => {
          const topRightX = Math.max(...court.points.map((p) => p.x));
          const topRightY = Math.min(...court.points.map((p) => p.y));
          const isHovered = hoveredCourt?.id === court.id;

          return (
            <AnimatePresence key={`label-${court.id}`}>
              {isHovered && (
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${topRightX}%`,
                    top: `${topRightY}%`,
                    transform: "translate(-10%, -120%)",
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white px-3 py-1.5 rounded-full shadow-lg border-2" style={{ borderColor: "#003d52" }}>
                    <span className="text-xs font-bold whitespace-nowrap" style={{ color: "#003d52" }}>
                      {court.name}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}

        {/* Hover preview image */}
        <AnimatePresence>
          {hoveredCourt && !selected && (
            <motion.div
              className="absolute w-24 h-32 rounded-lg overflow-hidden border-2 shadow-xl pointer-events-none"
              style={{
                borderColor: "#93c7c1",
                left: `${
                  hoveredCourt.points.reduce((sum, p) => sum + p.x, 0) / hoveredCourt.points.length
                }%`,
                top: `${
                  hoveredCourt.points.reduce((sum, p) => sum + p.y, 0) / hoveredCourt.points.length
                }%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <img
                src={`/images/courts/court${hoveredCourt.id}.jpg`}
                alt={hoveredCourt.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Booking Popup */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSelected(null);
              setSelectedSlot(null);
            }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { type: "spring", stiffness: 100, damping: 15 },
              }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row h-full">
                {/* Left Side - Court Info */}
                <div className="md:w-2/5 p-6 text-white" style={{ background: "linear-gradient(to bottom right, #003d52, #336879)" }}>
                  <button
                    onClick={() => {
                      setSelected(null);
                      setSelectedSlot(null);
                    }}
                    className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <X size={24} />
                  </button>
                  
                  <h2 className="text-3xl font-bold mb-2">{selected.name}</h2>
                  <p className="mb-6" style={{ color: "#CFF6F0" }}>{selected.description}</p>
                  
                  <div className="bg-white/10 backdrop-blur rounded-xl overflow-hidden h-64 relative">
                    <img
                      src={`/images/courts/court${selected.id}.jpg`}
                      alt={selected.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Right Side - Date & Slots */}
                <div className="md:w-3/5 p-6 overflow-y-auto">
                  <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "#0F1724" }}>
                      <Calendar size={18} />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={getTodayDate()}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                      style={{ borderColor: "#93c7c1" }}
                      onFocus={(e) => e.target.style.borderColor = "#003d52"}
                      onBlur={(e) => e.target.style.borderColor = "#93c7c1"}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: "#0F1724" }}>
                      <Clock size={18} />
                      Available Time Slots
                    </label>
                    
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "#003d52" }}></div>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-12" style={{ color: "#556779" }}>
                        <Clock size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No available slots for this date</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                        {availableSlots.map((slot) => (
                          <motion.button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className="px-4 py-3 rounded-lg font-medium transition-all"
                            style={{
                              backgroundColor: selectedSlot === slot ? "#003d52" : "#FBFBFD",
                              color: selectedSlot === slot ? "#FFFFFF" : "#0F1724",
                              transform: selectedSlot === slot ? "scale(1.05)" : "scale(1)",
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {slot}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSlot && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setShowConfirmation(true)}
                      className="w-full mt-6 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
                      style={{ background: "linear-gradient(to right, #003d52, #336879)" }}
                    >
                      Reserve {selectedSlot}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setShowConfirmation(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4" style={{ color: "#0F1724" }}>
                {bookingSuccess ? "Booking Confirmed!" : "Confirm Reservation"}
              </h3>
              
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle size={64} className="mx-auto mb-4" style={{ color: "#43A047" }} />
                  </motion.div>
                  <p className="text-lg font-semibold mb-2" style={{ color: "#43A047" }}>
                    Your court has been reserved successfully!
                  </p>
                  <div className="space-y-1 text-sm" style={{ color: "#556779" }}>
                    <p><strong style={{ color: "#0F1724" }}>{selected?.name}</strong></p>
                    <p>{selectedDate} at {selectedSlot}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mb-6" style={{ color: "#556779" }}>
                  <p><strong style={{ color: "#0F1724" }}>Court:</strong> {selected?.name}</p>
                  <p><strong style={{ color: "#0F1724" }}>Date:</strong> {selectedDate}</p>
                  <p><strong style={{ color: "#0F1724" }}>Time:</strong> {selectedSlot}</p>
                </div>
              )}
              <div className="flex gap-3">
                {bookingSuccess ? (
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setBookingSuccess(false);
                      setSelectedSlot(null);
                    }}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                    style={{ backgroundColor: "#43A047" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2E7D32"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#43A047"}
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowConfirmation(false)}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 border-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderColor: "#93c7c1", color: "#0F1724" }}
                      onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "#FBFBFD")}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReservation}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ backgroundColor: "#003d52" }}
                      onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "#021920")}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#003d52"}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Confirm"
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {bookingSuccess && !showConfirmation && (
          <motion.div
            className="fixed bottom-8 right-8 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-[70]"
            style={{ background: "linear-gradient(to right, #43A047, #66BB6A)" }}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          >
            <CheckCircle size={28} />
            <span className="font-bold text-lg">Booking Successful!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}