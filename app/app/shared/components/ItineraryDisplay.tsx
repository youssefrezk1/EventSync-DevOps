"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Avatar, Box, Chip, Typography, IconButton } from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface ItineraryItem {
  _id: string;
  type: "attraction" | "travel";
  date: string; // ISO date string
  time?: string; // "HH:MM"
  name?: string;
  from?: string;
  to?: string;
  imageUrl?: string;
  fromLocation?: string;
  toLocation?: string;
}

interface TripData {
  name: string;
  location: string;
  start: string; // ISO date
  end: string; // ISO date
  itinerary: ItineraryItem[];
}

interface Props {
  tripData?: TripData;
}

// NOTE: developer-provided local file path (will be transformed to URL by environment)
const SAMPLE_IMG = "/mnt/data/6a0bf5a0-8f0f-48bf-9f4b-1d3b239b0a0a.png";

function clamp(n: number, a = 0, b = 23) {
  return Math.max(a, Math.min(b, n));
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetweenInclusive(start: Date, end: Date) {
  // returns number of days inclusive
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / msPerDay);
  return diff + 1;
}

const formatDateReadable = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (time?: string) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
};

export default function ItineraryDisplay({ tripData }: Props) {
  // If no tripData provided we'll show a sample
  const sample: TripData = useMemo(() => ({
    name: "Paris Highlights",
    location: "Paris, France",
    start: "2025-11-01",
    end: "2025-11-04",
    itinerary: [
      {
        _id: "a1",
        type: "attraction",
        date: "2025-11-01",
        time: "09:00",
        name: "Eiffel Tower",
        imageUrl: SAMPLE_IMG,
        from: "09:00",
        to: "10:30",
      },
      {
        _id: "t1",
        type: "travel",
        date: "2025-11-01",
        time: "11:30",
        fromLocation: "Eiffel Tower",
        toLocation: "Louvre Museum",
      },
      {
        _id: "a2",
        type: "attraction",
        date: "2025-11-02",
        time: "10:00",
        name: "Louvre Museum",
        imageUrl: SAMPLE_IMG,
        from: "10:00",
        to: "13:30",
      },
      {
        _id: "a3",
        type: "attraction",
        date: "2025-11-03",
        time: "14:00",
        name: "Montmartre",
        imageUrl: SAMPLE_IMG,
        from: "14:00",
        to: "16:00",
      },
      {
        _id: "a4",
        type: "attraction",
        date: "2025-11-04",
        time: "11:00",
        name: "Notre-Dame",
        imageUrl: SAMPLE_IMG,
        from: "11:00",
        to: "12:00",
      },
    ],
  }), []);

  const data = tripData || sample;

  // compute total days from start->end inclusive
  const startDate = new Date(data.start);
  const endDate = new Date(data.end);
  const totalDays = daysBetweenInclusive(new Date(startDate), new Date(endDate));

  // Build day -> items map where day index is 1..n
  const dayMap = useMemo(() => {
    const map: { [k: number]: ItineraryItem[] } = {};
    for (let i = 1; i <= totalDays; i++) map[i] = [];

    data.itinerary.forEach((item) => {
      const itemDate = new Date(item.date);
      const diff = Math.floor((itemDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dayIndex = clamp(diff + 1, 1, totalDays);
      map[dayIndex].push(item);
    });

    // Sort each day's items by time (time OR from OR default 00:00)
    for (let i = 1; i <= totalDays; i++) {
      map[i].sort((a, b) => {
        const ta = a.time || a.from || "00:00";
        const tb = b.time || b.from || "00:00";
        return ta.localeCompare(tb);
      });
    }

    return map;
  }, [data.itinerary, startDate, totalDays]);

  const [expanded, setExpanded] = useState<number | null>(1);

  return (
    <Box className="w-full p-6 bg-gray-50 min-h-screen">
      <Box className="max-w-6xl mx-auto">
        <Box className="mb-6 flex items-center justify-between">
          <Box>
            <Typography variant="h3" className="font-extrabold text-4xl text-gray-800">
              {data.name}
            </Typography>
            <Typography className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <RoomIcon fontSize="small" className="text-blue-500" /> {data.location}
            </Typography>
          </Box>
          <Box className="text-right">
            <Typography className="text-gray-600">{totalDays} {totalDays === 1 ? "Day" : "Days"}</Typography>
            <Typography className="text-sm text-gray-400">{formatDateReadable(data.start)} — {formatDateReadable(data.end)}</Typography>
          </Box>
        </Box>

        <Box className="space-y-6">
          {/* Render each day */}
          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayIndex = idx + 1;
            const items = dayMap[dayIndex] || [];
            const dayDateStr = formatDateReadable(addDays(startDate, idx).toISOString());
            const isOpen = expanded === dayIndex;

            return (
              <Box key={`day-${dayIndex}`} className="bg-white rounded-2xl shadow-md overflow-hidden border">
                {/* Header */}
                <Box className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-white">
                  <Box className="flex items-center gap-4">
                    <Box className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 border border-blue-100">
                      <Typography className="font-bold text-blue-600">Day {dayIndex}</Typography>
                    </Box>
                    <Box>
                      <Typography className="font-semibold text-lg">{dayDateStr}</Typography>
                      <Typography className="text-sm text-gray-500">{items.length} {items.length === 1 ? "activity" : "activities"}</Typography>
                    </Box>
                  </Box>

                  <Box className="flex items-center gap-4">
                    <Chip label={`${items.length}`} size="small" className="bg-gray-100" />
                    <IconButton onClick={() => setExpanded(isOpen ? null : dayIndex)}>
                      {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </Box>

                {/* Content */}
                {isOpen && (
                  <Box className="p-6">
                    <Box className="flex gap-8">
                      {/* Left: Quick Attractions (1/3) */}
                      <Box className="w-1/3">
                        <Typography className="text-lg font-semibold mb-4">Attractions</Typography>
                        <Box className="space-y-4">
                          {items.length === 0 && (
                            <Box className="p-4 rounded-lg border border-dashed border-gray-200 text-gray-400">No activities for this day</Box>
                          )}

                          {items.map((it) => (
                            <Box key={it._id} className="flex items-center gap-3 p-3 rounded-xl bg-white border shadow-sm hover:shadow-md transition">
                              {it.type === "attraction" ? (
                                <Avatar src={it.imageUrl || SAMPLE_IMG} variant="rounded" sx={{ width: 64, height: 64, borderRadius: 12 }} />
                              ) : (
                                <Box className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center">
                                  <DirectionsCarIcon />
                                </Box>
                              )}

                              <Box className="flex-1">
                                <Typography className="font-semibold text-sm truncate">
                                  {it.type === "attraction" ? it.name : `${it.fromLocation} → ${it.toLocation}`}
                                </Typography>
                                <Typography className="text-xs text-gray-500">{formatTime(it.time || it.from)}</Typography>
                              </Box>

                              <Box>
                                <Chip label={it.type === "attraction" ? "Attraction" : "Travel"} size="small" />
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      {/* Right: Timeline (2/3) */}
                      <Box className="flex-1">
                        <Typography className="text-lg font-semibold mb-4">Timeline</Typography>
                        <Box className="relative">
                          <Box className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-100" />

                          <Box className="ml-12">
                            {items.map((it, i) => (
                              <Box key={it._id} className="flex gap-6 mb-6 last:mb-0 items-start">
                                {/* Dot & time */}
                                <Box className="w-24 text-right">
                                  <Typography className="font-bold text-lg text-gray-800">{formatTime(it.time || it.from || it.to)}</Typography>
                                </Box>

                                <Box className="flex-1">
                                  <Box className="bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition flex items-start gap-4">
                                    {it.type === "attraction" && (
                                      <Avatar src={it.imageUrl || SAMPLE_IMG} variant="rounded" sx={{ width: 96, height: 72, borderRadius: 14 }} />
                                    )}

                                    <Box className="flex-1">
                                      <Box className="flex items-center justify-between">
                                        <Typography className="text-xl font-bold text-gray-800">{it.type === "attraction" ? it.name : `${it.fromLocation} → ${it.toLocation}`}</Typography>
                                        <Box className="flex items-center gap-2">
                                          <Chip icon={<AccessTimeIcon />} label={it.time ? formatTime(it.time) : ""} size="small" className="bg-gray-50" />
                                          {it.type === "attraction" ? (
                                            <Chip icon={<RoomIcon />} label={it.to || it.name} size="small" className="bg-white" />
                                          ) : (
                                            <Chip icon={<DirectionsCarIcon />} label="Travel" size="small" className="bg-white" />
                                          )}
                                        </Box>
                                      </Box>

                                      {/* optional subtitle / duration */}
                                      <Typography className="text-sm text-gray-500 mt-2">
                                        {it.type === "attraction"
                                          ? `Duration: ${formatTime(it.from)} — ${formatTime(it.to)}`
                                          : "Estimated travel"}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            ))}

                            {/* If no items, show placeholder */}
                            {items.length === 0 && (
                              <Box className="p-6 rounded-lg border border-dashed border-gray-200 text-gray-400">No timeline events for this day</Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
