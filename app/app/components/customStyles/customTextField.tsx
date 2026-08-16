import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

const CustomTextField = styled(TextField)(() => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 6,
    backgroundColor: "white",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#dcdcdc",
    borderRadius: 6,
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#003d52",
    borderRadius: 6,
  },
}));

export default CustomTextField;
