"use client"; // important!!

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useEffect } from "react";

declare global {
  interface Window {
    keyState: Record<string, boolean>;
  }
}

interface PlayerProps {
  speed?: number;
}

function Player({ speed = 5 }: PlayerProps) {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const move = new THREE.Vector3();

    if (window.keyState?.["w"]) move.z -= 1;
    if (window.keyState?.["s"]) move.z += 1;
    if (window.keyState?.["a"]) move.x -= 1;
    if (window.keyState?.["d"]) move.x += 1;
     if (window.keyState?.["r"]) move.y += 1;
 if (window.keyState?.["t"]) move.y -= 1;
    if (move.length() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      ref.current?.position.add(move);
    }

    if (ref.current) {
      const target = new THREE.Vector3(
        ref.current.position.x,
        8,
        ref.current.position.z + 10
      );
      camera.position.lerp(target, 0.1);
      camera.lookAt(ref.current.position);
    }
  });

  return (
    <mesh ref={ref} position={[0, 1, 0]}>
      <capsuleGeometry args={[0.5, 1, 4, 8]} />
      <meshStandardMaterial color={"#ffcc66"} />
    </mesh>
  );
}

function MapPlane() {
  const texture = useTexture("/platform.png");
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

export default function MapScene() {
  useEffect(() => {
    window.keyState = {};

    const down = (e: KeyboardEvent) => (window.keyState[e.key.toLowerCase()] = true);
    const up = (e: KeyboardEvent) => (window.keyState[e.key.toLowerCase()] = false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <Canvas camera={{ position: [0, 8, 10], fov: 50 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.4} />
      <MapPlane />
      <Player />
      <OrbitControls enablePan={false} enableRotate={false} />
    </Canvas>
  );
}
