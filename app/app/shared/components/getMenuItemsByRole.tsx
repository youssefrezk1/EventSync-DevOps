"use client";

import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { SportsFootball, EventAvailable ,LocalOffer} from "@mui/icons-material";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import PeopleIcon from "@mui/icons-material/People";
import { Vote } from "lucide-react";

export function getMenuItemsByRole(role: string | undefined, staffRole?: string) {
  if (!role) return [];

  // 👉 TA = staff (falls under Staff dashboard)
  if (role === "TA") role = "Staff";

  // 👉 If Staff has internal roles (TA / Professor / Staff)
  if (role === "Staff" && staffRole === "Professor") {
    role = "Professor";
  }

  const menus: Record<string, any[]> = {
    student: [
      { text: "Home", icon: <HomeIcon />, href: "/dashboards/student" },
      
      { text: "Events", icon: <EventIcon />, href: "/dashboards/student/events" },
      {
        text: "Registered events",
        icon: <EventAvailable />,
        href: "/dashboards/student/registeredEvents",
      },
      { text: "Courts", icon: <SportsFootball />, href: "/dashboards/student/courts" },
       { text: "Tournaments", icon: <FitnessCenterIcon />, href: "/dashboards/student/tournaments" },
      { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/student/gym" },
      //{ text: "View Polls", icon: <Vote />, href: "/dashboards/student/boothsVoting" },
      { text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/student/loyaltyProgram"},
      { text: "Restaurants", icon: <BusinessIcon />, href: "/dashboards/student/restaurants" },
  ],

    Staff: [
      { text: "Home", icon: <HomeIcon />, href: "/dashboards/staff" },
      { text: "Events", icon: <EventIcon />, href: "/dashboards/staff/events" },
      {
        text: "Registered events",
        icon: <EventAvailable />,
        href: "/dashboards/staff/registeredEvents",
      },
      { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/staff/gym" },
      //{ text: "View Polls", icon: <Vote />, href: "/dashboards/staff/boothsVoting" },
      { text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/staff/loyaltyProgram"},
    ],

    Professor: [
      { text: "Home", icon: <HomeIcon />, href: "/dashboards/professor" },
      { text: "Events", icon: <EventIcon />, href: "/dashboards/professor/events" },
      {
        text: "Registered events",
        icon: <EventAvailable />,
        href: "/dashboards/professor/registeredEvents",
      },
      { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/professor/gym" },
      { text: "Workshops", icon: <WorkIcon />, href: "/dashboards/professor/workshops" },
     // { text: "View Polls", icon: <Vote />, href: "/dashboards/professor/boothsVoting" },
      { text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/professor/loyaltyProgram"},
    ],

    "event-office": [
      { text: "Home", icon: <HomeIcon />, href: "/dashboards/eventOffice" },
      { text: "Events", icon: <EventIcon />, href: "/dashboards/eventOffice/events" },
      { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/eventOffice/gym" },
      {
        text: "Workshop Requests",
        icon: <WorkIcon />,
        href: "/dashboards/eventOffice/workshopRequests",
      },
      {
        text: "Vendor Requests",
        icon: <BusinessIcon />,
        href: "/dashboards/eventOffice/vendorRequests",
      },
      { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/eventOffice/reports" },
      {
        text: "Overlapping Booths",
        icon: <HomeIcon />,
        href: "/dashboards/eventOffice/overlappingBooths",
      },
      { text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/eventOffice/loyaltyProgram"},
    ],

    admin: [
      { text: "Home", icon: <HomeIcon />, href: "/dashboards/admin" },
      { text: "Staff Verification", icon: <PeopleIcon />, href: "/dashboards/admin/roles" },
      { text: "Vendor Requests", icon: <BusinessIcon />, href: "/dashboards/admin/vendorRequests" },
      { text: "Events", icon: <EventIcon />, href: "/dashboards/admin/events" },
      { text: "Admins", icon: <PeopleIcon />, href: "/dashboards/admin/admins" },
      { text: "Event Office", icon: <WorkIcon />, href: "/dashboards/admin/eventoffice" },
      { text: "All Users", icon: <PeopleIcon />, href: "/dashboards/admin/all-users" },
      { text: "All Vendors", icon: <BusinessIcon />, href: "/dashboards/admin/vendors" },
      { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/admin/reports" },
      { text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/admin/loyaltyProgram"},
    ],
  };

  return menus[role] || [];
}
