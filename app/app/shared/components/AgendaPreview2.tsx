"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Collapse,
} from "@mui/material";

import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import PlaceIcon from "@mui/icons-material/Place";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { motion } from "framer-motion";

interface Session {
  id: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  professor?: string;
  location?: string;
  description?: string;
  isBreak?: boolean;
  // optional tags
  tags?: string[];
}

interface AgendaPreviewProps {
  agenda: string; // JSON string
  title?: string;
  subtitle?: string;
  // new: required to generate empty days
  workshopStart?: string; // ISO date string
  workshopEnd?: string;   // ISO date string
}

export default function AgendaPreview({
  agenda,
  title = "Agenda",
  subtitle = "Daily schedule overview",
  workshopStart,
  workshopEnd,
}: AgendaPreviewProps) {
  // Parse agenda safely
  const parsedAgenda: Session[] = useMemo(() => {
    try {
      if (!agenda) return [];
      const p = JSON.parse(agenda);
      return Array.isArray(p) ? p : [];
    } catch (e) {
      console.error("Agenda parsing error", e);
      return [];
    }
  }, [agenda]);

  // generate ISO date string (yyyy-mm-dd)
  const generateDates = (start?: string, end?: string) => {
    if (!start || !end) return [];
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return [];
    
    const arr: string[] = [];
    const cur = new Date(s);

    cur.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);

    while (cur <= e) {
      arr.push(cur.toLocaleDateString("en-CA"));
      cur.setDate(cur.getDate() + 1);
    }

    return arr;
  };

  const allDates = useMemo(() => generateDates(workshopStart, workshopEnd), [
    workshopStart,
    workshopEnd,
  ]);

  // group sessions by date string
  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>();
    parsedAgenda.forEach((s) => {
      const d = s.date;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    });
    // sort each day's sessions by startTime
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.startTime || "") > (b.startTime || "") ? 1 : -1);
    }
    return map;
  }, [parsedAgenda]);

  const [openDayIndex, setOpenDayIndex] = useState<number | null>(null);

  // formatting helpers
  const formatFriendlyDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (hhmm?: string) => {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return hhmm;
    const ampm = h >= 12 ? "PM" : "AM";
    const display = h % 12 || 12;
    return `${display}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  // small animation variants
  const cardHover = { scale: 1.01, boxShadow: "0 12px 30px rgba(2,6,23,0.08)" };
  const rowFade = { hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0 } };

  return (
    <Box sx={{ width: "100%", mx: "auto", py: 2 }}>
            {/* header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{title}</Typography>
           
          </Box>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip icon={<EventIcon />} label={allDates.length ? `${allDates.length} day${allDates.length>1?'s':''}` : "No dates"} />
            
          </Stack>
        </Stack>
      </Box>

      {/* days list */}

      {/* Days list */}
      <Box>
        {allDates.length === 0 ? (
          <Card sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px solid #e2e8f0" }}>
            <Typography sx={{ color: "#64748b" }}>
              No workshop date range supplied. Provide start & end dates to generate the agenda days.
            </Typography>
          </Card>
        ) : (
          allDates.map((isoDate, idx) => {
            const sessions = grouped.get(isoDate) || [];
            const sessionCount = sessions.filter(s => !s.isBreak).length;
            const isOpen = openDayIndex === idx;

            return (
              <Box key={isoDate} sx={{ mb: 3 }}>
                {/* main card */}
                <Box sx={{ flex: 1 }}>
                  <motion.div whileHover={cardHover} style={{ borderRadius: 12 }}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        border: "1px solid #e6eef8",
                        overflow: "hidden",
                      }}
                      role="region"
                      aria-labelledby={`day-${idx + 1}-label`}
                    >
                      <CardContent
                        onClick={() => setOpenDayIndex(isOpen ? null : idx)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          borderBottom: isOpen ? "3px solid #e0e0e6ff" : "none",
                          py: 3.5,
                          px: 3,
                          bgcolor: "#d9eaf2ff",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <EventIcon sx={{ color: "black", fontSize: 25 }} />
                          <Typography id={`day-${idx + 1}-label`} sx={{ fontSize: 21, fontWeight: 600, color: "black" }}>
                            Day {idx + 1} - {new Date(isoDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Chip 
                            label={sessionCount ? `${sessionCount} session${sessionCount!==1?'s':''}` : "No sessions"} 
                            size="small"
                            sx={{ bgcolor: "#e5ebf3ff" }}
                          />
                          <IconButton aria-label={isOpen ? "collapse day" : "expand day"} sx={{ color: "black" }}>
                            {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </CardContent>

                      <Collapse in={isOpen} timeout="auto">
                        <Box sx={{ p: 3, pt: 3 }}>
                          {sessions.length === 0 ? (
                            <Box sx={{ py: 4, textAlign: "center", color: "#64748b" }}>
                              <Typography sx={{ fontStyle: "italic", mb: 1 }}>No sessions on this day.</Typography>
                            </Box>
                          ) : (
                            <Stack spacing={3}>
                              {sessions.map((s, sidx) => {
                                const isBreak = !!s.isBreak;
                                return (
                                  <motion.div key={s.id || `${isoDate}-${sidx}`} variants={rowFade} initial="hidden" animate="show">
                                    <Card
                                      sx={{
                                        p: 3,
                                        borderRadius: 0,
                                        background: isBreak ? "#f4f4f4ff" : "#ffffffff",
                                        boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                                      }}
                                    >
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                                        {/* Time Section */}
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 160 }}>
                                          {isBreak ? (
                                            <FastfoodIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
                                          ) : (
                                            <AccessTimeIcon sx={{ fontSize: 18, color: "#0f172a" }} />
                                          )}
                                          <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#0f172a", whiteSpace: "nowrap" }}>
                                            {formatTime(s.startTime)} — {formatTime(s.endTime)}
                                          </Typography>
                                          {isBreak && (
                                            <Chip
                                              label="Break"
                                              size="small"
                                              sx={{ bgcolor: "#f3f4f6", color: "#4b5563", fontWeight: 600 }}
                                            />
                                          )}
                                        </Box>

                                        {/* Title Section */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography sx={{ fontWeight: 800, fontSize: isBreak ? 19 : 18, color: "#0f172a" }}>
                                            {isBreak ? (s.title || "Break Time") : (s.title || "Untitled Session")}
                                          </Typography>
                                        </Box>

                                        {/* Professor and Location */}
                                        {!isBreak && (
                                          <>
                                            {s.professor && (
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 140 }}>
                                                <PersonIcon sx={{ fontSize: 16, color: "#475569", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: 13, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                  {s.professor}
                                                </Typography>
                                              </Box>
                                            )}
                                            {s.location && (
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 120 }}>
                                                <PlaceIcon sx={{ fontSize: 16, color: "#475569", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: 13, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                  {s.location}
                                                </Typography>
                                              </Box>
                                            )}
                                          </>
                                        )}
                                      </Box>

                                      {/* Description */}
                                      {!isBreak && s.description && (
                                        <Typography sx={{ fontSize: 14, color: "#475569", mt: 2, ml: "190px" }}>
                                          {s.description}
                                        </Typography>
                                      )}
                                    </Card>
                                  </motion.div>
                                );
                              })}
                            </Stack>
                          )}
                        </Box>
                      </Collapse>
                    </Card>
                  </motion.div>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}