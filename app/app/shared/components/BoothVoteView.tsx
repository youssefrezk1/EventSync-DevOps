"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Vote, CheckCircle, Clock, MapPin, Building2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/api';
import BasicLayout from '@/components/layouts/basicLayout2';

interface Vendor {
  _id: string;
  companyName: string;
  email: string;
}

interface Booth {
  _id: string;
  VendorID: Vendor;
  StartDate: string;
  EndDate: string;
  Location: string;
  BoothSize: '2x2' | '4x4';
  SetupDuration: string;
}

interface PollEvent {
  booth: Booth;
  count: number;
  _id: string;
}

interface Poll {
  _id: string;
  Events: PollEvent[];
  createdAt: string;
  updatedAt: string;
  userVotedFor?: string;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  href: string;
}

interface PollsViewComponentProps {
  menuItems: MenuItem[];
}

const PollsViewComponent: React.FC<PollsViewComponentProps> = ({ menuItems }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [votingPoll, setVotingPoll] = useState<string | null>(null);
  const [expandedPolls, setExpandedPolls] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchPolls = async (): Promise<void> => {
   try {
    setLoading(true);
    const res = await api.get('/api/booths/polls');
    console.log('Fetched polls:', res.data);
    
    if (res.data.success) {
      const fetchedPolls: Poll[] = res.data.data;
      setPolls(fetchedPolls);

      // 🔥 AUTO DELETE LOGIC
      fetchedPolls.forEach(async (poll: Poll) => {
        const hasExpiredBooth = poll.Events.some(event => {
          const startDate = new Date(event.booth.StartDate);
          return startDate < new Date();  // already passed
        });

        if (hasExpiredBooth) {
          try {
            await api.delete(`/api/booths/poll/${poll._id}`);
            console.log(`Deleted expired poll: ${poll._id}`);

            // Remove it from UI list
            setPolls(prev => prev.filter(p => p._id !== poll._id));
          } catch (deleteErr) {
            console.error(`Failed to delete expired poll ${poll._id}`, deleteErr);
          }
        }
      });
    }
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError('Failed to load polls. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, boothId: string): Promise<void> => {
    try {
      setVotingPoll(pollId);
      const res = await api.post('/api/booths/poll/vote', { pollId, boothId });
      
      if (res.data.success) {
        setPolls(prevPolls =>
          prevPolls.map(poll =>
            poll._id === pollId 
              ? { ...res.data.data, userVotedFor: boothId }
              : poll
          )
        );

        if (res.data.voteChanged) {
          showNotification('success', 'Your vote has been changed successfully');
        } else {
          showNotification('success', 'Vote recorded successfully');
        }
      }
    } catch (err: any) {
      console.error('Error voting:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit vote. Please try again.';
      showNotification('error', errorMessage);
    } finally {
      setVotingPoll(null);
    }
  };

  const getTotalVotes = (poll: Poll): number => {
    return poll.Events.reduce((sum, event) => sum + event.count, 0);
  };

  const getVotePercentage = (votes: number, total: number): number => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const getLeadingBooth = (poll: Poll): PollEvent | null => {
    if (poll.Events.length === 0) return null;
    return poll.Events.reduce((max, event) => 
      event.count > max.count ? event : max
    , poll.Events[0]);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateRange = (start: string, end: string): string => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const togglePoll = (pollId: string): void => {
    setExpandedPolls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pollId)) {
        newSet.delete(pollId);
      } else {
        newSet.add(pollId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <BasicLayout menuItems={menuItems}>
        <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-300 border-t-gray-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading polls...</p>
          </div>
        </div>
      </BasicLayout>
    );
  }

  if (error) {
    return (
      <BasicLayout menuItems={menuItems}>
        <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-md">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-gray-800 text-center mb-4">{error}</p>
            <button 
              onClick={fetchPolls}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout menuItems={menuItems}>
      <div className="min-h-screen bg-[#f5f6fa] p-6">
        {notification && (
          <div className={`fixed top-4 right-4 z-50 max-w-md px-5 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-600' : 
            notification.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
          } text-white`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        )}
<div className="mb-8 relative rounded-xl overflow-hidden shadow-lg">
            <div className="absolute inset-0">
              <img 
                src="https://www-s3-live.kent.edu/s3fs-root/s3fs-public/FoodTruckBanner.jpg?VersionId=c8HovJm1AbpL.fpqHpexQImjmeSNCwGu" 
                alt="Exhibition booth" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40"></div>
            </div>
            <div className="relative px-8 py-12">
              <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
                Active Polls
              </h1>
              <p className="text-gray-100 text-lg drop-shadow">
                Vote for your preferred booth setup
              </p>
            </div>
          </div>
        <div className="max-w-4xl mx-auto">
                   

          {polls.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Polls</h3>
              <p className="text-gray-500">Check back later for new polls to participate in.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {polls.map((poll, pollIndex) => {
                const totalVotes = getTotalVotes(poll);
                const leadingBooth = getLeadingBooth(poll);
                const userHasVoted = !!poll.userVotedFor;
                const isExpanded = expandedPolls.has(poll._id);
                
                return (
                  <div 
                    key={poll._id} 
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div 
                      className="border-b border-gray-200 p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => togglePoll(poll._id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-semibold text-gray-900">
                              Booth Selection Poll #{pollIndex + 1}
                            </h2>
                            {userHasVoted && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                <CheckCircle className="w-3 h-3" />
                                You voted
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {poll.Events.length} options • {totalVotes} votes
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <Clock className="w-4 h-4" />
                              <span>Created {formatDate(poll.createdAt)}</span>
                            </div>
                          </div>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6">
                        <div className="space-y-4">
                          {poll.Events.map((event, index) => {
                            const percentage = getVotePercentage(event.count, totalVotes);
                            const isLeading = leadingBooth?._id === event._id && totalVotes > 0;
                            const isUserVote = poll.userVotedFor === event.booth._id;
                            
                            return (
                              <div 
                                key={event._id}
                                className={`relative rounded-lg border transition-all duration-200 ${
                                  isUserVote
                                    ? 'border-gray-400 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <div 
                                  className="absolute inset-0 bg-gray-100 rounded-lg transition-all duration-500"
                                  style={{ 
                                    width: `${percentage}%`,
                                    opacity: 0.5
                                  }}
                                />

                                <div className="relative p-5">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                                          {index + 1}
                                        </span>
                                        <h3 className="text-base font-semibold text-gray-900">
                                          {event.booth.VendorID?.companyName || 'Unknown Vendor'}
                                        </h3>
                                        {isUserVote && (
                                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-white text-xs font-medium rounded">
                                            <CheckCircle className="w-3 h-3" />
                                            Your Vote
                                          </span>
                                        )}
                                        {isLeading && !isUserVote && (
                                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-600 text-white text-xs font-medium rounded">
                                            <TrendingUp className="w-3 h-3" />
                                            Leading
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                                        <span className="flex items-center gap-1.5">
                                          <MapPin className="w-4 h-4 text-gray-400" />
                                          {event.booth.Location}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          <Building2 className="w-4 h-4 text-gray-400" />
                                          {event.booth.BoothSize}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          <Clock className="w-4 h-4 text-gray-400" />
                                          {event.booth.SetupDuration}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDateRange(event.booth.StartDate, event.booth.EndDate)}
                                      </div>
                                    </div>

                                    <div className="flex-shrink-0 text-right">
                                      <div className="mb-3">
                                        <div className="text-2xl font-semibold text-gray-900">
                                          {event.count}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {percentage}%
                                        </div>
                                      </div>
                                      
                                      <button
                                        onClick={() => handleVote(poll._id, event.booth._id)}
                                        disabled={votingPoll === poll._id}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                          isUserVote
                                            ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                      >
                                        {votingPoll === poll._id ? (
                                          <span className="flex items-center gap-2">
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Voting
                                          </span>
                                        ) : (
                                          'Vote'
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-6">
                              <span className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {totalVotes} votes
                              </span>
                              <span className="flex items-center gap-2">
                                <Vote className="w-4 h-4" />
                                {poll.Events.length} options
                              </span>
                            </div>
                            <div>
                              Updated {formatDate(poll.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BasicLayout>
  );
};

export default PollsViewComponent;