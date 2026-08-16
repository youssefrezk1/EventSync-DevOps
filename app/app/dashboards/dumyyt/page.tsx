"use client";

import React, { useState } from "react";
import { Button, Box, Typography } from "@mui/material";
import TripFormDialog from "@/shared/components/TripFormDialog"; // Adjust the import path as needed



export default function SimplestTripTest() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    location: "",
    price: "",
    shortDescription: "",
    capacity: "",
    start: "",
    end: "",
    registrationDeadline: "",
    itinerary: []
  });

  return (
    <div style={{ padding: '16px' }}>
      <Button 
        variant="contained" 
        onClick={() => setDialogOpen(true)}
        sx={{ 
          bgcolor: "#12495cff",
          "&:hover": { bgcolor: "#0f3d4d" }
        }}
      >
        Test Trip Form
      </Button>

      <TripFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        form={form}
        setForm={setForm}
        isEdit={false}
        onSubmit={() => {
          console.log("Trip submitted:", form);
          setDialogOpen(false);
        }}
      />
    </div>
  );
}