"use client";

import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import Header from "@/components/header2";
import Footer from "@/components/footer";
import theme from "@/lib/theme";
import type { TMenuItem } from "@/components/sidebars/sideBar";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

type TBasicLayoutProps = {
  children: React.ReactNode;
  menuItems: TMenuItem[];
};

export default function BasicLayout({ children, menuItems }: TBasicLayoutProps) {
  return (
    <ThemeProvider theme={theme}>
      <FavoritesProvider>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            backgroundColor: theme.palette.background.default,
          }}
        >
          {/* ✅ Header with tabs instead of sidebar */}
          <Header menuItems={menuItems} />

          {/* ✅ Main content area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              mt: 10, // space for fixed header
              minHeight: "100%",
              transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.standard,
              }),
            }}
          >
            {children}
          </Box>

          {/* ✅ Footer */}
          <Footer />
        </Box>
      </FavoritesProvider>
    </ThemeProvider>
  );
}