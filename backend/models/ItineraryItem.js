import mongoose from "mongoose";

const ItineraryItemSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    type: {
      type: String,
      enum: ["attraction", "travel"],
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    // ATTRACTION FIELDS
    name: String,
    from: String,
    to: String,
    imageUrl: String, // stored Cloudinary URL

    // TRAVEL FIELDS
    fromLocation: String,
    toLocation: String,
    time: String,
  },
  { timestamps: true }
);

export const ItineraryItem = mongoose.model("ItineraryItem", ItineraryItemSchema);
