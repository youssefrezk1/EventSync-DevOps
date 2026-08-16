// app/dashboards/student/boothsVoting/page.tsx
import React from 'react';
import PollsViewComponent from '@/shared/components/BoothVoteView';
import { Home, Calendar, CheckCircle, Users, Dumbbell, Vote } from 'lucide-react';
import { LocalOffer } from "@mui/icons-material";

const StudentPollsPage = () => {
  const studentMenuItems = [
    { text: "Home", icon: <Home />, href: "/dashboards/student" },
    { text: "Events", icon: <Calendar />, href: "/dashboards/student/events" },
    { text: "Registered events", icon: <CheckCircle />, href: "/dashboards/student/registeredEvents" },
    { text: "Courts", icon: <Users />, href: "/dashboards/student/courts" },
    { text: "Gym", icon: <Dumbbell />, href: "/dashboards/student/gym" },
    
      {
        text: "Loyalty Program",
        icon: <LocalOffer />,
        href: "/dashboards/student/loyaltyProgram",
      }
  ];

  return <PollsViewComponent menuItems={studentMenuItems} />;
};

export default StudentPollsPage;