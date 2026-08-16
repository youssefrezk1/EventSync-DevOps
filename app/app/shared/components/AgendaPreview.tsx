import React from 'react';
import { Calendar, Clock, Coffee, User, MapPin } from 'lucide-react';

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
  agenda: string; // JSON string of Session[]
  title?: string;
  subtitle?: string;
}

const AgendaPreview: React.FC<AgendaPreviewProps> = ({ 
  agenda,
  title = "Workshop Agenda",
  subtitle = "Participant View"
}) => {
  const [sessions, setSessions] = React.useState<Session[]>([]);

  React.useEffect(() => {
    try {
      const parsedAgenda = JSON.parse(agenda);
      if (Array.isArray(parsedAgenda)) {
        setSessions(parsedAgenda);
      }
    } catch (error) {
      console.error('Failed to parse agenda:', error);
      setSessions([]);
    }
  }, [agenda]);

  const groupSessionsByDate = () => {
    const grouped: { [key: string]: Session[] } = {};
    sessions
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })
      .forEach(session => {
        if (!grouped[session.date]) {
          grouped[session.date] = [];
        }
        grouped[session.date].push(session);
      });
    return grouped;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupedSessions = groupSessionsByDate();

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Calendar className="h-8 w-8" />
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
          <p className="text-blue-100">{subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {Object.keys(groupedSessions).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p>No sessions scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                <div key={date} className="space-y-4">
                  {/* Date Header */}
                  <div className="border-b-2 border-blue-500 pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900">
                        {formatDate(date)}
                      </h2>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="space-y-3">
                    {dateSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`pl-4 border-l-4 py-3 px-4 rounded-r transition-all hover:shadow-md ${
                          session.isBreak 
                            ? 'border-orange-400 bg-orange-50 hover:bg-orange-100' 
                            : 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        {/* Time and Title */}
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-shrink-0 pt-1">
                            {session.isBreak ? (
                              <Coffee className="h-5 w-5 text-orange-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-3 flex-wrap">
                              <span className="font-bold text-gray-900 text-lg">
                                {formatTime(session.startTime)}
                              </span>
                              {session.isBreak && (
                                <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs font-semibold rounded">
                                  BREAK
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-lg mt-1">
                              {session.title || 'Break Time'}
                            </h3>
                          </div>
                        </div>

                        {/* Details for non-break sessions */}
                        {!session.isBreak && (
                          <div className="ml-8 space-y-1">
                            {session.professor && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{session.professor}</span>
                              </div>
                            )}
                            {session.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span>{session.location}</span>
                              </div>
                            )}
                            {session.description && (
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                {session.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default AgendaPreview;