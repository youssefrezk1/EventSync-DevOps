import { SelectProps,Select } from "@mui/material";
import { styled } from "@mui/material/styles";

const CustomSelect = styled((props: SelectProps<string>) => (
  <Select<string>
    {...props}
    
  />
))(() => ({
  backgroundColor: "white",
  borderRadius: 6,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#dcdcdc",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#bcbcbc",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#003d52",
  },
  "& .MuiSelect-select": {
    padding: "8px 12px",
  },
}));

export default CustomSelect;
