"use client";
import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  Slide,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { TransitionProps } from "@mui/material/transitions";

// 👇 Define Slide Transition
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// 👇 Define props interface
interface ListPopupMUIProps<T> {
  title?: string;
  items: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  onOpen?: () => void | Promise<void>;
  loading?: boolean;
}

export default function ListPopupMUI<T>({
  title = "Items",
  items,
  renderItem,
  onOpen,
  loading = false,
}: ListPopupMUIProps<T>) {
  const [open, setOpen] = React.useState<boolean>(false);

  const handleOpen = async (): Promise<void> => {
    setOpen(true);
    if (onOpen) await onOpen();
  };

  const handleClose = (): void => setOpen(false);

  return (
    <>
      {/* Trigger Button */}
      <Button variant="contained" color="primary" onClick={handleOpen}>
        View {title}
      </Button>

      {/* Popup Dialog */}
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{title}</Typography>
            <IconButton edge="end" color="inherit" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : items.length > 0 ? (
            items.map((item, idx) => (
              <Card
                key={idx}
                sx={{
                  mb: 2,
                  "&:hover": { backgroundColor: "action.hover" },
                  transition: "0.2s",
                }}
              >
                <CardContent>
                  {renderItem ? (
                    renderItem(item, idx)
                  ) : (
                    <Typography>{String(item)}</Typography>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography color="text.secondary" align="center">
              No items available
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}