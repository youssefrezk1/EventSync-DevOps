"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import React, { useEffect } from "react";

type Point = { id: string; x: number; y: number };

type Route = {
  id: string;
  path: string[];
};

type Props = {
  mapUrl: string;
  points: Point[];
  routes: Route[];
  activeRouteId: string;
};

const AnimatedFootstepMap: React.FC<Props> = ({
  mapUrl,
  points,
  routes,
  activeRouteId,
}) => {
  const route = routes.find((r) => r.id === activeRouteId);
  if (!route) return null;

  const pathPoints = route.path.map((id) => points.find(p => p?.id === id)) as Point[];
  const polylinePoints = pathPoints.map(p => `${p.x}%,${p.y}%`).join(" ");

  // Animation progress (0 → last index)
  const progress = useMotionValue(0);

  // Calculate x,y interpolation
  const markerX = useTransform(progress, (t) => {
    const i = Math.floor(t);
    const f = t - i;
    if (i >= pathPoints.length - 1) return pathPoints[pathPoints.length - 1].x;
    return pathPoints[i].x + (pathPoints[i + 1].x - pathPoints[i].x) * f;
  });

  const markerY = useTransform(progress, (t) => {
    const i = Math.floor(t);
    const f = t - i;
    if (i >= pathPoints.length - 1) return pathPoints[pathPoints.length - 1].y;
    return pathPoints[i].y + (pathPoints[i + 1].y - pathPoints[i].y) * f;
  });

  // Convert % into pixel offset for motion.div
  const markerXpx = useTransform(markerX, (v) => `calc(${v}% - 20px)`);
  const markerYpx = useTransform(markerY, (v) => `calc(${v}% - 20px)`);

  // Restart animation when route changes
  useEffect(() => {
    progress.set(0);
    animate(progress, pathPoints.length - 1, {
      duration: 4,
      ease: "easeInOut",
    });
  }, [activeRouteId]);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden">
      <Image src={mapUrl} alt="Map" fill className="object-cover" />

      {/* Animated Path */}
      <svg className="absolute top-0 left-0 w-full h-full">
        <motion.polyline
          points={polylinePoints}
          fill="none"
          stroke="#00eaff"
          strokeWidth={6}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0px 0px 8px #00eaff)" }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
      </svg>

      {/* MOVING FOOTSTEP */}
      <motion.div
        style={{
          position: "absolute",
          width: 40,
          height: 40,
          x: markerXpx,
          y: markerYpx,
        }}
      >
        <Image
          src="/footstep.png"
          alt="Footstep"
          width={40}
          height={40}
          className="drop-shadow-[0_0_10px_white]"
        />
      </motion.div>
    </div>
  );
};

export default AnimatedFootstepMap;
