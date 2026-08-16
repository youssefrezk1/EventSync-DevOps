"use client";

import { IconButton, Badge } from "@mui/material";
import { Favorite } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useFavoritesContext } from "../../contexts/FavoritesContext";

interface FavoritesButtonProps {
  userRole: string;
}

export default function FavoritesButton({ userRole }: FavoritesButtonProps) {
  const router = useRouter();
  const { favoritesCount } = useFavoritesContext();

  // Only show for student, staff, TA, and professor roles
  const shouldShow = ["student", "Staff", "TA", "Professor"].includes(userRole);

  if (!shouldShow) return null;

  const handleClick = () => {
    // Navigate to the appropriate favorites page based on role
    if (userRole === "student") {
      router.push("/dashboards/student/favorites");
    } else if (["Staff", "TA"].includes(userRole)) {
      router.push("/dashboards/staff/favorites");
    } else if (userRole === "Professor") {
      router.push("/dashboards/professor/favorites");
    }
  };

  return (
    <IconButton
      onClick={handleClick}
      sx={{
        color: "primary.main",
        "&:hover": { backgroundColor: "rgba(156, 39, 176, 0.08)" },
      }}
    >
      <Badge badgeContent={favoritesCount} color="secondary">
        <Favorite />
      </Badge>
    </IconButton>
  );
}