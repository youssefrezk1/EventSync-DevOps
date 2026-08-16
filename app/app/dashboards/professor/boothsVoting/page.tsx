// app/dashboards/student/boothsVoting/page.tsx
import React from 'react';
import PollsViewComponent from '@/shared/components/BoothVoteView';
import { HomeIcon, Vote } from 'lucide-react';
import { EventAvailable,LocalOffer } from '@mui/icons-material';
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";


const professorPollsPage = () => {
  const professorMenuItems = [
 { text: "Home", icon: <HomeIcon />, href: "/dashboards/professor" },
  {
    text: "Events",
    icon: <EventIcon />,
    href: "/dashboards/professor/events",
  },
  {
      text: "Registered events",
      icon: <EventAvailable />,
      href: "/dashboards/professor/registeredEvents",
    },
  {
    text: "Gym",
    icon: <FitnessCenterIcon />,
    href: "/dashboards/professor/gym",
  },
  {
    text: "Workshops",
    icon: <WorkIcon />,
    href: "/dashboards/professor/workshops",
  }, 
     {text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/professor/loyaltyProgram"},
  
  ];

  return <PollsViewComponent menuItems={professorMenuItems} />;
};

export default professorPollsPage;