import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, TextField } from "@mui/material";
import React, { useState } from "react";

interface SearchBarGroupProps {
  searchValue?: string;
  onPerformSearch?: (value: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  onDownload?: () => void;
}

const SearchBarGroup: React.FC<SearchBarGroupProps> = ({ searchValue }) => {
  const [searchQuery, setSearchQuery] = useState(searchValue);

  return (
    <Box
      display="flex"
      bgcolor="white"
      boxShadow="0px 0px 8px 2px rgba(0,0,0,0.1)"
      borderRadius={16}
      width={600}
    >
      <TextField
        fullWidth
        placeholder="Search for events, activities, and more..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          maxWidth: "600px",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: "50px",
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
              <SearchIcon sx={{ color: "primary.main", fontSize: 28 }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBarGroup;
