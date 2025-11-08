import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import styles from './Fixture3DModel.module.scss';

interface Fixture3DModelProps {
  panValue: number; // 0-255 DMX value
  tiltValue: number; // 0-255 DMX value
  width?: number;
  height?: number;
  className?: string;
}

// Moving head fixture component
function MovingHeadFixture({ panValue, tiltValue }: { panValue: number; tiltValue: number }) {
  const baseRef = useRef<THREE.Group>(null);
  const panArmRef = useRef<THREE.Group>(null);
  const fixtureHeadRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  // Convert DMX values to angles
  // Pan: 0-255 maps to -180° to +180° (540° total range)
  // Tilt: 0-255 maps to -90° to +90° (180° total range)
  const panAngle = useMemo(() => {
    return ((panValue - 128) / 128) * Math.PI; // -π to +π
  }, [panValue]);

  const tiltAngle = useMemo(() => {
    return ((tiltValue - 128) / 128) * (Math.PI / 2); // -π/2 to +π/2
  }, [tiltValue]);

  // Animate smooth rotation
  useFrame(() => {
    if (panArmRef.current) {
      panArmRef.current.rotation.y = panAngle;
    }
    if (fixtureHeadRef.current) {
      fixtureHeadRef.current.rotation.x = -tiltAngle; // Negative for correct tilt direction
    }
    if (beamRef.current) {
      // Animate beam intensity/pulse
      const intensity = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
      if (beamRef.current.material instanceof THREE.MeshStandardMaterial) {
        beamRef.current.material.emissiveIntensity = intensity;
      }
    }
  });

  return (
    <group>
      {/* Base stand (cylindrical) */}
      <group ref={baseRef} position={[0, -0.4, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
          <meshStandardMaterial color="#707080" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Pan arm (rotates around Y axis) */}
      <group ref={panArmRef} position={[0, 0, 0]}>
        {/* Pan joint */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#e0e0e8" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Horizontal arm */}
        <mesh position={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.4, 0.06, 0.06]} />
          <meshStandardMaterial color="#9090a0" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Fixture head (at end of arm, rotates around local X axis for tilt) */}
        <group ref={fixtureHeadRef} position={[0.4, 0, 0]}>
          {/* Fixture head body */}
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.2, 0.25]} />
            <meshStandardMaterial color="#b0b0d0" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Lens (front face) */}
          <mesh position={[0.175, 0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 32]} />
            <meshStandardMaterial color="#ffeb3b" emissive="#ffeb3b" emissiveIntensity={0.8} />
          </mesh>

          {/* Light beam (cone) - rotated to point forward from lens along +X axis */}
          <mesh ref={beamRef} position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.15, 0.8, 16]} />
            <meshStandardMaterial
              color="#ffd700"
              transparent
              opacity={0.5}
              emissive="#ffd700"
              emissiveIntensity={1.2}
            />
          </mesh>
        </group>
      </group>

      {/* Ground plane for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

export const Fixture3DModel: React.FC<Fixture3DModelProps> = ({
  panValue,
  tiltValue,
  width = 400,
  height = 400,
  className
}) => {
  return (
    <div className={`${styles.fixture3DContainer} ${className || ''}`} style={{ width, height }}>
      <Canvas
        shadows
        camera={{ position: [1.5, 0.5, 1.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={5}
          autoRotate={false}
        />

        {/* Fixture model */}
        <MovingHeadFixture panValue={panValue} tiltValue={tiltValue} />

        {/* Grid helper */}
        <gridHelper args={[2, 20, '#444', '#222']} />
      </Canvas>
    </div>
  );
};

