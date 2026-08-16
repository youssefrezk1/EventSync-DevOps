"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Highlight {
  id: number;
  letter: string;
  points: { x: number; y: number }[];
}

const highlights: Highlight[] = [
  {
    id: 1,
    letter: "A",
    points: [
      { x: 35.4, y: 44 },
      { x: 37.9, y: 44 },
      { x: 37.9, y: 55.5 },
      { x: 35.4, y: 55.5 },
    ],
  },
  {
    id: 2,
    letter: "B",
    points: [
      { x: 41, y: 25.6 },
      { x: 46.5, y: 21 },
      { x: 47.2, y: 25.2 },
      { x: 42, y: 29.35 },
    ],
  },
  {
    id: 3,
    letter: "C",
    points: [
      { x: 53.8, y: 21.3 },
      { x: 58.9, y: 25 },
      { x: 58.2, y: 29.4 },
      { x: 53, y: 25.1 },
    ],
  },
  {
    id: 4,
    letter: "D",
    points: [
      { x: 62.2, y: 44 },
      { x: 64.7, y: 44 },
      { x: 64.7, y: 55.4 },
      { x: 62.2, y: 55.4 },
    ],
  },
  {
    id: 5,
    letter: "E",
    points: [
      { x: 58, y: 69.3 },
      { x: 53.1, y: 72.7 },
      { x: 54, y: 77 },
      { x: 58.8, y: 73.2 },
    ],
  },
  {
    id: 6,
    letter: "F",
    points: [
      { x: 42.2, y: 68.9 },
      { x: 47.6, y: 73.2 },
      { x: 46.8, y: 77.4 },
      { x: 41.3, y: 73.2 },
    ],
  },
];

// Helper function to check if a point is inside a polygon
function isPointInPolygon(
  x: number,
  y: number,
  points: { x: number; y: number }[]
) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x,
      yi = points[i].y;
    const xj = points[j].x,
      yj = points[j].y;

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Helper: Scale polygon outward
const scalePolygon = (points: { x: number; y: number }[], scale: number) => {
  const centroid = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  centroid.x /= points.length;
  centroid.y /= points.length;
  return points.map((p) => ({
    x: centroid.x + (p.x - centroid.x) * scale,
    y: centroid.y + (p.y - centroid.y) * scale,
  }));
};

interface SelectableMapProps {
  onSelectionChange?: (letter: string | null) => void;
  imageSrc?: string;
  locationAvailability?: { [key: string]: { available: boolean; checking?: boolean } };
  canSelect?: boolean;
  style?: React.CSSProperties;
}

export default function SelectableMap({ 
  onSelectionChange, 
  imageSrc = "/images/platform.png",
  locationAvailability = {},
  canSelect = true,
  style
}: SelectableMapProps) {
  const [selected, setSelected] = useState<Highlight | null>(null);
  const [hovered, setHovered] = useState<Highlight | null>(null);

  const handleSelection = (highlight: Highlight) => {
    if (!canSelect) {
      return;
    }

    const availability = locationAvailability[highlight.letter];
    
    // If checking or not available, don't allow selection
    if (availability?.checking || (availability && !availability.available)) {
      return;
    }

    const newSelection = selected?.letter === highlight.letter ? null : highlight;
    setSelected(newSelection);
    
    if (onSelectionChange) {
      onSelectionChange(newSelection ? newSelection.letter : null);
    }
  };

  const getLocationColors = (letter: string, isHovered: boolean, isSelected: boolean) => {
    const availability = locationAvailability[letter];

    // Checking state
    if (availability?.checking) {
      return {
        fill: "rgba(156, 163, 175, 0.15)",
        stroke: "#9CA3AF",
        textColor: "#6B7280",
        cursor: "wait",
        glow: false
      };
    }

    // Not available (occupied)
    if (availability && !availability.available) {
      return {
        fill: isHovered ? "rgba(220, 38, 38, 0.2)" : "rgba(220, 38, 38, 0.1)",
        stroke: isHovered ? "#DC2626" : "#EF4444",
        textColor: "#B91C1C",
        cursor: "not-allowed",
        glow: isHovered
      };
    }

    // Available
    if (availability?.available) {
      if (isSelected) {
        return {
          fill: "rgba(34, 197, 94, 0.25)",
          stroke: "#16A34A",
          textColor: "#15803D",
          cursor: "pointer",
          glow: true
        };
      }
      if (isHovered) {
        return {
          fill: "rgba(34, 197, 94, 0.2)",
          stroke: "#22C55E",
          textColor: "#16A34A",
          cursor: "pointer",
          glow: true
        };
      }
      return {
        fill: "rgba(34, 197, 94, 0.1)",
        stroke: "#4ADE80",
        textColor: "#22C55E",
        cursor: "pointer",
        glow: false
      };
    }

    // Default (no availability check yet or can't select)
    if (!canSelect) {
      return {
        fill: "rgba(156, 163, 175, 0.05)",
        stroke: "#D1D5DB",
        textColor: "#9CA3AF",
        cursor: "not-allowed",
        glow: false
      };
    }

    // Default selectable (theme colors)
    if (isSelected) {
      return {
        fill: "rgba(0, 61, 82, 0.2)",
        stroke: "#003d52",
        textColor: "#003d52",
        cursor: "pointer",
        glow: true
      };
    }
    if (isHovered) {
      return {
        fill: "rgba(0, 61, 82, 0.15)",
        stroke: "#336879",
        textColor: "#336879",
        cursor: "pointer",
        glow: true
      };
    }
    return {
      fill: "rgba(0, 61, 82, 0.05)",
      stroke: "#003d52",
      textColor: "#000000",
      cursor: "pointer",
      glow: false
    };
  };

  // Hover tooltip content
  const getHoverTooltip = (letter: string) => {
    const availability = locationAvailability[letter];
    
    if (availability?.checking) {
      return "Checking availability...";
    }
    
    if (availability && !availability.available) {
      return "Location occupied - Not available";
    }
    
    if (availability?.available) {
      return "Available - Click to select";
    }
    
    return "Select location";
  };

  return (
    <div className="relative w-full h-full bg-white" style={style}>
      {/* Background image */}
      <img
        src={imageSrc}
        alt="Booth Map"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* Hover Tooltip */}
      {hovered && (
        <motion.div
          className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium pointer-events-none z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          style={{
            left: `${hovered.points.reduce((sum, p) => sum + p.x, 0) / hovered.points.length}%`,
            top: `${hovered.points.reduce((sum, p) => sum + p.y, 0) / hovered.points.length - 8}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {getHoverTooltip(hovered.letter)}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </motion.div>
      )}

      {/* Highlights */}
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {highlights.map((h) => {
          const isHovered = hovered?.id === h.id;
          const isSelected = selected?.id === h.id;
          const availability = locationAvailability[h.letter];
          const colors = getLocationColors(h.letter, isHovered, isSelected);

          // Centroid for the letter
          const centroid = {
            x: h.points.reduce((sum, p) => sum + p.x, 0) / h.points.length,
            y: h.points.reduce((sum, p) => sum + p.y, 0) / h.points.length,
          };

          return (
            <g
              key={h.id}
              onMouseEnter={() => setHovered(h)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => {
                e.stopPropagation();
                handleSelection(h);
              }}
              style={{ cursor: colors.cursor }}
            >
              {/* Glow effect for selected/hovered available locations */}
              {colors.glow && (
                <motion.polygon
                  points={scalePolygon(h.points, 1.15)
                    .map((p) => `${p.x},${p.y}`)
                    .join(" ")}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth="0.2"
                  strokeLinejoin="round"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}

              {/* Outer border */}
              <motion.polygon
                points={scalePolygon(h.points, 1.08)
                  .map((p) => `${p.x},${p.y}`)
                  .join(" ")}
                fill="none"
                stroke={colors.stroke}
                strokeWidth="0.3"
                strokeLinejoin="round"
                initial={{ opacity: 0, pathLength: 0, scale: 0.95 }}
                animate={{
                  opacity: isHovered || isSelected ? 1 : 0,
                  pathLength: isHovered || isSelected ? 1 : 0,
                  scale: isHovered || isSelected ? 1 : 0.95,
                }}
                transition={{
                  opacity: { duration: 0.3 },
                  pathLength: { duration: 0.7, ease: "easeOut" },
                  scale: { duration: 0.4, ease: "backOut" }
                }}
              />

              {/* Inner border */}
              <motion.polygon
                points={h.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke={colors.stroke}
                strokeWidth="0.35"
                strokeLinejoin="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{
                  opacity: isHovered || isSelected ? 1 : 0,
                  pathLength: isHovered || isSelected ? 1 : 0,
                }}
                transition={{
                  opacity: { duration: 0.2 },
                  pathLength: { duration: 0.5, ease: "easeOut" },
                }}
              />

              {/* Fill with animated opacity */}
              <motion.polygon
                points={h.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill={colors.fill}
                stroke="none"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: isHovered || isSelected ? 1 : 0,
                  scale: isHovered || isSelected ? 1 : 0.95
                }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeOut"
                }}
              />

              {/* Pulsing effect for selected locations */}
              {isSelected && (
                <motion.polygon
                  points={h.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth="0.2"
                  strokeLinejoin="round"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ 
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}

              {/* Loading animation for checking state */}
              {availability?.checking && (
                <motion.circle
                  cx={centroid.x}
                  cy={centroid.y + 1.5}
                  r="0.8"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="0.15"
                  strokeDasharray="4 2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* Letter with enhanced styling */}
              <motion.text
                x={centroid.x}
                y={centroid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-bold select-none"
                style={{ 
                  fontSize: "2.2px",
                  filter: isSelected ? "drop-shadow(0 0 1px rgba(0,0,0,0.3))" : "none"
                }}
                animate={{
                  fill: colors.textColor,
                  scale: isHovered && colors.cursor === "pointer" ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {h.letter}
              </motion.text>

              {/* Status indicator dot */}
              {availability && !availability.checking && (
                <motion.circle
                  cx={centroid.x}
                  cy={centroid.y + 1.5}
                  r="0.4"
                  fill={availability.available ? "#22C55E" : "#DC2626"}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, type: "spring" }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Click outside to deselect */}
      {selected && (
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={() => {
            setSelected(null);
            if (onSelectionChange) {
              onSelectionChange(null);
            }
          }}
        />
      )}
    </div>
  );
}