"use client";

import { useState } from "react";
import { Box, Drawer, Toolbar } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ReusableSidebar, { TMenuItem } from "@/components/sidebars/sideBar";
import theme from "@/lib/theme";

const drawerWidth = 240;
const collapsedWidth = 60;

type TBasicLayoutProps = {
  children: React.ReactNode;
  menuItems: TMenuItem[];
};

export default function BasicLayout({
  children,
  menuItems,
}: TBasicLayoutProps) {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {/* Header */}
        <Header />

        {/* Main content */}
        <Box sx={{ display: "flex", flexGrow: 1, mt: 8 }}>
          {/* Sidebar Drawer */}
          <Drawer
            variant="permanent"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
              width: hovered ? drawerWidth : collapsedWidth,
              flexShrink: 0,
              whiteSpace: "nowrap",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.standard,
              }),
              "& .MuiDrawer-paper": {
                width: hovered ? drawerWidth : collapsedWidth,
                overflowX: "hidden",
                boxSizing: "border-box",
                bgcolor: "primary.main",
                color: "white",
                transition: theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.standard,
                }),
              },
            }}
          >
            <Toolbar />
            <ReusableSidebar open={hovered} menuItems={menuItems} />
          </Drawer>

          {/* Page Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              backgroundColor: "#f5f6fa",
              minHeight: "100%",
              transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.standard,
              }),
            }}
          >
            {children}
          </Box>
        </Box>

        {/* Footer */}
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
