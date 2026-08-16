"use client";

import Link from "next/link";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
} from "@mui/material";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";

export type TMenuItem= {
  text: string;
  icon?: ReactNode;
  href: string;
}

interface ReusableSidebarProps {
  open: boolean;
  menuItems: TMenuItem[];
}

export default function ReusableSidebar({ open, menuItems }: ReusableSidebarProps) {
  const pathname = usePathname();

  return (
    <List sx={{ mt: 1, flexGrow: 1 }}>
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
            <Link href={item.href} passHref legacyBehavior>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                  borderRadius: 2,
                  mx: 1,
                  bgcolor: isActive ? "white" : "transparent",
                  "&:hover": {
                    bgcolor: isActive ? "white" : "primary.dark",
                  },
                }}
              >
                <Tooltip title={!open ? item.text : ""} placement="right">
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : "auto",
                      justifyContent: "center",
                      color: isActive ? "primary.main" : "white",
                      transition: "color 0.3s",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>

                {open && (
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          color: isActive ? "primary.main" : "white",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {item.text}
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            </Link>
          </ListItem>
        );
      })}
    </List>
  );
}