"use client";

import React, { useState } from "react";
import { Button } from "@mui/material";
import TripFormDialog from "@/shared/components/TripFormDialog";
import { api } from "@/api";

export default function TripsPage() {
  const [openDialog, setOpenDialog] = useState(false);
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
    itinerary: [],
  });

const handleSubmit = async () => {
  try {
    const formData = new FormData();

    // Add basic trip fields
    formData.append("name", form.name);
    formData.append("location", form.location);
    formData.append("price", form.price);
    formData.append("shortDescription", form.shortDescription);
    formData.append("capacity", form.capacity);
    formData.append("start", form.start);
    formData.append("end", form.end);
    formData.append("registrationDeadline", form.registrationDeadline);

    // FIXED: Track image count separately for correct field naming
    let imageCounter = 0;
    console.log("Form itinerary items:", form.itinerary);
form.itinerary.forEach((item: any, i: number) => {
  console.log(`Item ${i}:`, {
    type: item.type,
    name: item.name,
    hasFile: item.imageFile instanceof File,
    fileName: item.imageFile?.name
  });
});
    // Process itinerary items
    const itineraryData = form.itinerary.map((item: any) => {
      let imageIndex: number | undefined = undefined;
      
      // If this item has an image, append it with the CURRENT counter
      if (item.imageFile instanceof File) {
        const fieldName = `itinerary_image_${imageCounter}`;
        formData.append(fieldName, item.imageFile);
        console.log(`Adding image at ${fieldName}:`, item.imageFile.name);
        
        imageIndex = imageCounter;
        imageCounter++; // Increment only when we actually add an image
      }

      // Return item data without the File object (can't be JSON stringified)
      const { imageFile, id, ...itemData } = item;
      return {
        ...itemData,
        hasImage: !!(item.imageFile instanceof File),
        imageIndex: imageIndex, // This now correctly maps to the FormData field
      };
    });

    formData.append("itinerary", JSON.stringify(itineraryData));

    // Debug: Log all FormData entries
    console.log("FormData contents:");
    console.log(`Total images being uploaded: ${imageCounter}`);
    for (let [key, value] of formData.entries()) {
      console.log(key, value instanceof File ? `File: ${value.name}` : value);
    }

    // Send to backend
    const response = await api.post("/api/trips/2", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Trip created successfully:", response.data);
    alert("Trip created successfully!");

    // Reset form and close dialog
    setForm({
      name: "",
      location: "",
      price: "",
      shortDescription: "",
      capacity: "",
      start: "",
      end: "",
      registrationDeadline: "",
      itinerary: [],
    });
    setActiveStep(0);
    setOpenDialog(false);
  } catch (error: any) {
    console.error("Error creating trip:", error);
    alert(
      "Error creating trip: " +
        (error.response?.data?.message || error.message)
    );
  }
};

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Trips Management</h1>

      <Button
        variant="contained"
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 4 }}
      >
        Create New Trip
      </Button>

      <TripFormDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setActiveStep(0);
        }}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        form={form}
        setForm={setForm}
        isEdit={false}
        onSubmit={handleSubmit}
      />
    </div>
  );
}