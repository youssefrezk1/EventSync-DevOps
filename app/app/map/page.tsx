"use client"; // important for page itself

import dynamic from "next/dynamic";

const MapScene = dynamic(() => import("@/components/MapScene"), {
  ssr: false, // prevent server-side rendering
});

export default function MapPage() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <MapScene />
    </div>
  );
}
