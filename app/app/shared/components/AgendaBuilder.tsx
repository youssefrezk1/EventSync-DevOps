"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Coffee,
  Calendar,
  Clock,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  professor: string;
  location: string;
  description: string;
  isBreak: boolean;
}

interface AgendaBuilderProps {
  startDateTime: string;
  endDateTime: string;
  professors: string[];
  initialAgenda?: string;
  onChange?: (agendaJson: string) => void;
}

const AgendaBuilder: React.FC<AgendaBuilderProps> = ({
  startDateTime,
  endDateTime,
  professors,
  initialAgenda,
  onChange,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showModal, setShowModal] = useState(false);

  const emptySession: Session = {
    id: "",
    date: "",
    startTime: "",
    endTime: "",
    title: "",
    professor: "",
    location: "",
    description: "",
    isBreak: false,
  };

  const [formData, setFormData] = useState<Session>(emptySession);

  useEffect(() => {
    if (initialAgenda && initialAgenda.trim() !== "") {
      try {
        const parsedAgenda = JSON.parse(initialAgenda);
        if (Array.isArray(parsedAgenda)) setSessions(parsedAgenda);
      } catch (error) {
        console.error("Failed to parse initial agenda:", error);
        setSessions([]);
      }
    } else setSessions([]);
  }, [initialAgenda]);

  const getDateFromISO = (iso: string) => iso.split("T")[0];
  const getTimeFromISO = (iso: string) => iso.split("T")[1] || "00:00";
  const workshopStartDate = getDateFromISO(startDateTime);
  const workshopEndDate = getDateFromISO(endDateTime);
  const workshopStartTime = getTimeFromISO(startDateTime);
  const workshopEndTime = getTimeFromISO(endDateTime);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  
  const getDayNumber = (date: string) => {
    const start = new Date(workshopStartDate);
    const current = new Date(date);
    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };
  
  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 || 12;
    return `${display}:${m} ${ampm}`;
  };

  const groupSessionsByDate = () => {
    const grouped: { [key: string]: Session[] } = {};
    sessions
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })
      .forEach((s) => {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
      });
    return grouped;
  };

  const handleOpenModal = (isBreak: boolean, session?: Session) => {
    if (session) {
      setFormData(session);
      setEditingSession(session);
    } else {
      setFormData({ ...emptySession, id: Date.now().toString(), isBreak });
      setEditingSession(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(emptySession);
    setEditingSession(null);
  };

  const handleSaveSession = () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      alert("Please fill in date, start time, and end time");
      return;
    }
    if (!formData.isBreak && !formData.title) {
      alert("Please provide a session title");
      return;
    }
    if (formData.startTime >= formData.endTime) {
      alert("End time must be after start time");
      return;
    }
    if (formData.date < workshopStartDate || formData.date > workshopEndDate) {
      alert(`Session must be between ${formatDate(workshopStartDate)} and ${formatDate(workshopEndDate)}`);
      return;
    }

    const overlap = sessions.find((s) => {
      if (editingSession && s.id === editingSession.id) return false;
      if (s.date !== formData.date) return false;
      return formData.startTime < s.endTime && formData.endTime > s.startTime;
    });

    if (overlap) {
      alert(`This session overlaps with "${overlap.title || "Break Time"}"`);
      return;
    }

    const updated = editingSession
      ? sessions.map((s) => (s.id === editingSession.id ? formData : s))
      : [...sessions, formData];

    setSessions(updated);
    onChange?.(JSON.stringify(updated, null, 2));
    handleCloseModal();
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    onChange?.(JSON.stringify(updated, null, 2));
  };

  const renderEditView = () => {
    const grouped = groupSessionsByDate();
    const hasSessions = Object.keys(grouped).length > 0;

    return (
      <div className="space-y-3">
        {!hasSessions ? (
          <div className="text-center py-12 bg-white border border-gray-200">
            <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-xs mb-3">No sessions added yet</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleOpenModal(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003d52] text-white text-xs font-medium hover:bg-[#021920] transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add Session
              </button>
              <button
                onClick={() => handleOpenModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
              >
                <Coffee className="h-3.5 w-3.5" /> Add Break
              </button>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([date, list]) => (
              <div key={date} className="border border-gray-200">
                <div className="bg-[#003d52] text-white px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <h3 className="font-medium text-xs">Day {getDayNumber(date)} - {formatDate(date)}</h3>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {list.map((session) => (
                    <div key={session.id} className="bg-white hover:bg-gray-50 transition px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          {session.isBreak ? (
                            <Coffee className="h-3.5 w-3.5 text-gray-400" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-[#003d52]" />
                          )}
                          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </span>
                          {session.isBreak && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium">
                              Break
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-xs text-gray-900">
                            {session.title || "Break Time"}
                          </span>
                        </div>

                        {!session.isBreak && (
                          <>
                            {session.professor && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 min-w-[120px]">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{session.professor}</span>
                              </div>
                            )}
                            {session.location && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 min-w-[100px]">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{session.location}</span>
                              </div>
                            )}
                          </>
                        )}

                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => handleOpenModal(session.isBreak, session)}
                            className="p-1 text-gray-500 hover:bg-gray-100 transition"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-1 text-gray-500 hover:bg-gray-100 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {!session.isBreak && session.description && (
                        <p className="text-xs text-gray-500 mt-1.5 ml-[152px]">
                          {session.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-center gap-2 pt-1">
              <button
                onClick={() => handleOpenModal(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003d52] text-white text-xs font-medium hover:bg-[#021920] transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add Session
              </button>
              <button
                onClick={() => handleOpenModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
              >
                <Coffee className="h-3.5 w-3.5" /> Add Break
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#003d52]" />
              <h2 className="text-sm font-semibold text-gray-900">Full Agenda</h2>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium">
                {sessions.length}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> Expand
                </>
              )}
            </button>
          </div>
        </div>
        {isExpanded && <div className="p-3">{renderEditView()}</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-lg">
            <div className="border-b border-gray-200 px-3 py-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {editingSession
                  ? `Edit ${formData.isBreak ? "Break" : "Session"}`
                  : `Add ${formData.isBreak ? "Break" : "Session"}`}
              </h3>
            </div>

            <div className="p-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={workshopStartDate}
                  max={workshopEndDate}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                  />
                </div>
              </div>

              {!formData.isBreak && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Session Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Introduction to AI"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Professor
                    </label>
                    <select
                      value={formData.professor}
                      onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                    >
                      <option value="">Select a professor</option>
                      {professors.map((prof, i) => (
                        <option key={i} value={prof}>
                          {prof}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., C7.303"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the session..."
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-200 px-3 py-2 flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                className="px-3 py-1.5 text-xs font-medium bg-[#003d52] text-white hover:bg-[#021920] transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaBuilder;