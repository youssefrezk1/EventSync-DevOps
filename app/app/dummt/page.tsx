// app/receipt/page.tsx
"use client";
import React from "react";
import Receipt from "@/shared/components/Recipt"; // adjust path
import { Box, Container, Typography } from "@mui/material";

type FoodItem = {
  name: string;
  Price: number;
};

type OrderItem = {
  foodItem: FoodItem;
  quantity: number;
};

type Order = {
  _id: string;
  pickupLocation: string;
  items: OrderItem[];
};

export default function Page() {
  const dummyOrder: Order = {
    _id: "ORDER-DEMO-2025-001",
    pickupLocation: "UC",
    items: [
      {
        foodItem: { name: "Chicken Shawarma", Price: 85 },
        quantity: 1,
      },
      {
        foodItem: { name: "Iced Latte", Price: 55 },
        quantity: 2,
      },
      {
        foodItem: { name: "French Fries", Price: 30 },
        quantity: 3,
      },
    ],
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "start",
        pt: 6,
      }}
    >
      <Typography variant="h4" fontWeight={800} mb={3}>
        Receipt Preview
      </Typography>

      <Receipt order={dummyOrder} />
    </Container>
  );
}
