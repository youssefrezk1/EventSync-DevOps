"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Highlight {
  id: number;
  letter: string;
  points: { x: number; y: number }[];
}

const highlights: Highlight[] = [
  { id: 1, letter: "A", points: [{ x: 35.35, y: 44 }, { x: 37.5, y: 44 }, { x: 37.5, y: 55.5 }, { x: 35.35, y: 55.5 }] },
  { id: 2, letter: "B", points: [{ x: 41.5, y: 24.6 }, { x: 47, y: 20.9 }, { x: 47.5, y: 24.5 }, { x: 42.6, y: 29.35 }] },
  { id: 3, letter: "C", points: [{ x: 53.6, y: 21 }, { x: 58.6, y: 25 }, { x: 57.7, y: 29.3 }, { x: 52.5, y: 24.7 }] },
  { id: 4, letter: "D", points: [{ x: 62.4, y: 43.5 }, { x: 64.8, y: 43.5 }, { x: 64.8, y: 55 }, { x: 62.4, y: 55 }] },
  { id: 5, letter: "E", points: [{ x: 57.8, y: 69.3 }, { x: 52.8, y: 72.8 }, { x: 53.56, y: 77 }, { x: 58.6, y: 72.4 }] },
  { id: 6, letter: "F", points: [{ x: 42.4, y: 68.9 }, { x: 47.6, y: 73 }, { x: 46.8, y: 77.1 }, { x: 41.5, y: 73.1 }] },
];

// Point-in-polygon helper
function isPointInPolygon(x: number, y: number, points: { x: number; y: number }[]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-6) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Scale polygon outward for borders
const scalePolygon = (points: { x: number; y: number }[], scale: number) => {
  const centroid = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  centroid.x /= points.length;
  centroid.y /= points.length;
  return points.map(p => ({
    x: centroid.x + (p.x - centroid.x) * scale,
    y: centroid.y + (p.y - centroid.y) * scale,
  }));
};

interface SelectableMapProps {
  onSelectionChange?: (letter: string | null) => void;
  imageSrc?: string;
  width?: number;
  height?: number;
}

export default function SelectableMap({
  onSelectionChange,
  imageSrc = "/images/platform.png",
  width = 1000,
  height = 800,
}: SelectableMapProps) {
  const [selected, setSelected] = useState<Highlight | null>(null);
  const [hovered, setHovered] = useState<Highlight | null>(null);

  const handleSelection = (highlight: Highlight | null) => {
    setSelected(highlight);
    onSelectionChange?.(highlight ? highlight.letter : null);
  };

  return (
    <div
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        overflow: "hidden",
        margin: "0 auto",
      }}
    >
      {/* Map image */}
      <img
        src={imageSrc}
        alt="Map"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />

      {/* SVG overlay */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        onClick={(e) => {
          const svg = e.currentTarget;
          const rect = svg.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;

          const clicked = highlights.find((h) => isPointInPolygon(x, y, h.points));
          console.log(`Clicked at: x=${x.toFixed(2)}, y=${y.toFixed(2)}, Zone: ${clicked?.letter ?? "none"}`);
        }}
      >
        {highlights.map((h) => {
          const isHovered = hovered?.id === h.id;
          const isSelected = selected?.id === h.id;
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
                handleSelection(isSelected ? null : h);
              }}
              style={{ cursor: "pointer" }}
            >
              <motion.polygon
                points={h.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill={isSelected ? "rgba(157,0,255,0.15)" : "rgba(157,0,255,0.05)"}
                stroke="#9d00ff"
                strokeWidth="0.3"
                animate={{
                  opacity: isHovered || isSelected ? 1 : 0.7,
                }}
              />
              <motion.polygon
                points={scalePolygon(h.points, 1.08).map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#ff0057"
                strokeWidth="0.25"
                animate={{
                  opacity: isHovered || isSelected ? 1 : 0,
                }}
              />
              <motion.text
                x={centroid.x}
                y={centroid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: "2.2px",
                  fontWeight: 600,
                  userSelect: "none",
                }}
                animate={{
                  fill: isSelected ? "#c084fc" : isHovered ? "#fb7185" : "#000",
                }}
              >
                {h.letter}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
