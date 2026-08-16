"use client";
import React from "react";
import {
  Coffee,
  Calendar,
  Clock,
  User,
  MapPin,
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

interface AgendaPreviewProps {
  agendaJson: string;
  startDateTime: string;
  endDateTime: string;
}

const AgendaPreview: React.FC<AgendaPreviewProps> = ({
  agendaJson,
  startDateTime,
  endDateTime,
}) => {
  let sessions: Session[] = [];
  
  try {
    if (agendaJson && agendaJson.trim() !== "") {
      const parsed = JSON.parse(agendaJson);
      if (Array.isArray(parsed)) sessions = parsed;
    }
  } catch (error) {
    console.error("Failed to parse agenda:", error);
  }

  const getDateFromISO = (iso: string) => iso.split("T")[0];
  const workshopStartDate = getDateFromISO(startDateTime);

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

  const grouped = groupSessionsByDate();
  const hasSessions = Object.keys(grouped).length > 0;

  if (!hasSessions) {
    return (
      <div className="w-full">
        <div className="bg-white border border-gray-200">
          <div className="text-center py-6">
            <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-xs">No sessions scheduled yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200">
       

        <div className="space-y-3 p-3">
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
        </div>
      </div>
    </div>
  );
};

export default AgendaPreview;