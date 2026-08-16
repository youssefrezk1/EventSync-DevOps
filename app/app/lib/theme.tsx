// app/lib/theme.ts
"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    
    primary: {
      main: "#003d52", 
      light: "#336879ff",
      dark: "#021920ff",
      contrastText: "#FFFFFF",
    },
 
    secondary: {
      main: "#93c7c1ff", 
      light: "#CFF6F0",
      dark: "#749d98ff",
      contrastText: "#0B1E1B",
    },
    background: {
      default: "#FBFBFD", 
      paper: "#FFFFFF",
    },
    error: {
      main: "#E53935",
    },
    warning: {
      main: "#FB8C00",
    },
    info: {
      main: "#0288D1",
    },
    success: {
      main: "#43A047",
    },
    text: {
      primary: "#0F1724", 
      secondary: "#556779", 
    },
  },

  typography: {
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontSize: "3rem", fontWeight: 600, color: "#0F1724" },
    h2: { fontSize: "2.25rem", fontWeight: 600, color: "#0F1724" },
    h3: { fontSize: "1.75rem", fontWeight: 600, color: "#0F1724" },
    h4: { fontSize: "1.5rem", fontWeight: 500, color: "#0F1724" },
    h5: { fontSize: "1.25rem", fontWeight: 500, color: "#0F1724" },
    h6: { fontSize: "1rem", fontWeight: 500, color: "#0F1724" },
    body1: { fontSize: "1rem", color: "#243444" },
    body2: { fontSize: "0.875rem", color: "#556779" },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 18px",
          textTransform: "none",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          minHeight: 48,
          paddingLeft: 12,
          paddingRight: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // subtle glassy look when used with background.default
        },
      },
    },
  },

  spacing: 8,
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;
