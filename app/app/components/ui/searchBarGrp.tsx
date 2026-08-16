"use client";

import {
  Grid,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import { Search } from "@mui/icons-material";

interface SearchFilterBarProps {
  searchValue: string;
  locationValue: string;
  dateValue: string;
  onSearchChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onReset: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  locationValue,
  dateValue,
  onSearchChange,
  onLocationChange,
  onDateChange,
  onReset,
}) => {
  return (
    <Grid container spacing={2} alignItems="center" justifyContent={"center"}>
      <Grid size={{xs: 12, md: 3.5}} width={380}>
        <TextField
          fullWidth
          placeholder="Search for events..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: "50px",
            boxShadow: "0px 0px 8px 2px rgba(0,0,0,0.1)",
            "& .MuiOutlinedInput-root": {
              borderRadius: "50px",
              "& fieldset": {
                border: "none",
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "primary.main", fontSize: 24 }} />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid size={{xs: 12, md: 3.5}}>
        <FormControl fullWidth>
          <Select
            value={locationValue}
            onChange={(e) => onLocationChange(e.target.value)}
            displayEmpty
            sx={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: "50px",
              boxShadow: "0px 0px 8px 2px rgba(0,0,0,0.1)",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="">All locations</MenuItem>
            <MenuItem value="GUC Cairo">GUC Cairo</MenuItem>
            <MenuItem value="GUC Berlin">GUC Berlin</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{xs: 12, md: 3.5}}>
        <TextField
          fullWidth
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: "50px",
            boxShadow: "0px 0px 8px 2px rgba(0,0,0,0.1)",
            "& .MuiOutlinedInput-root": {
              borderRadius: "50px",
              "& fieldset": {
                border: "none",
              },
            },
          }}
        />
      </Grid>
      <Grid size={{xs: 12, md: 1.5}}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onReset}
          sx={{
            borderRadius: "50px",
            textTransform: "none",
            fontWeight: 600,
            py: 1.5,
            borderColor: "divider",
            color: "text.secondary",
            boxShadow: "0px 0px 8px 2px rgba(0,0,0,0.1)",
            "&:hover": {
              borderColor: "primary.main",
              color: "primary.main",
              boxShadow: "0px 0px 12px 2px rgba(0,0,0,0.15)",
            },
          }}
        >
          Reset
        </Button>
      </Grid>
    </Grid>
  );
};
