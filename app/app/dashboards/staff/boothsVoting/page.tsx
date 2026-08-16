// app/dashboards/student/boothsVoting/page.tsx
import React from 'react';
import PollsViewComponent from '@/shared/components/BoothVoteView';
import { HomeIcon, Vote } from 'lucide-react';
import { EventAvailable ,LocalOffer} from '@mui/icons-material';
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import EventIcon from "@mui/icons-material/Event";


const staffPollsPage = () => {
  const staffMenuItems = [
   { text: "Home", icon: <HomeIcon />, href: "/dashboards/staff" },
  {
    text: "Events",
    icon: <EventIcon />,
    href: "/dashboards/staff/events",
  },
    {
      text: "Registered events",
      icon: <EventAvailable />,
      href: "/dashboards/staff/registeredEvents",
    },
  {
    text: "Gym",
    icon: <FitnessCenterIcon />,
    href: "/dashboards/staff/gym",
  },
    {text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/staff/loyaltyProgram"},

  ];

  return <PollsViewComponent menuItems={staffMenuItems} />;
};

export default staffPollsPage;