"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import React, { useEffect } from "react";

type Point = {
  id: string;
  x: number;
  y: number;
};

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

  const pathPoints: Point[] = route
    ? route.path
        .map((id) => points.find((p) => p.id === id))
        .filter((p): p is Point => p !== undefined)
    : [];

  const polylinePoints = pathPoints
    .map((p) => `${p.x}%,${p.y}%`)
    .join(" ");

  // Hooks MUST always be called, even when there is no route.
  const progress = useMotionValue(0);

  const markerX = useTransform(progress, (t) => {
    if (pathPoints.length === 0) return 0;

    const i = Math.floor(t);
    const f = t - i;

    if (i >= pathPoints.length - 1) {
      return pathPoints[pathPoints.length - 1].x;
    }

    return (
      pathPoints[i].x +
      (pathPoints[i + 1].x - pathPoints[i].x) * f
    );
  });

  const markerY = useTransform(progress, (t) => {
    if (pathPoints.length === 0) return 0;

    const i = Math.floor(t);
    const f = t - i;

    if (i >= pathPoints.length - 1) {
      return pathPoints[pathPoints.length - 1].y;
    }

    return (
      pathPoints[i].y +
      (pathPoints[i + 1].y - pathPoints[i].y) * f
    );
  });

  const markerXpx = useTransform(
    markerX,
    (v) => `calc(${v}% - 20px)`
  );

  const markerYpx = useTransform(
    markerY,
    (v) => `calc(${v}% - 20px)`
  );

  useEffect(() => {
    progress.set(0);

    if (pathPoints.length < 2) {
      return;
    }

    const controls = animate(progress, pathPoints.length - 1, {
      duration: 4,
      ease: "easeInOut",
    });

    return () => {
      controls.stop();
    };
  }, [activeRouteId, pathPoints.length, progress]);

  if (!route || pathPoints.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden">
      <Image
        src={mapUrl}
        alt="Map"
        fill
        className="object-cover"
      />

      <svg className="absolute top-0 left-0 w-full h-full">
        <motion.polyline
          points={polylinePoints}
          fill="none"
          stroke="#00eaff"
          strokeWidth={6}
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0px 0px 8px #00eaff)",
          }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 3,
            ease: "easeInOut",
          }}
        />
      </svg>

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
