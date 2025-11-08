import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import styles from './Fixture3DModel.module.scss';

interface Fixture3DModelProps {
  panValue: number; // 0-255 DMX value
  tiltValue: number; // 0-255 DMX value
  zoomValue?: number; // 0-255 DMX value (optional)
  irisValue?: number; // 0-255 DMX value (optional)
  width?: number;
  height?: number;
  className?: string;
}

// Moving head fixture component - Pixar lamp style
function MovingHeadFixture({ panValue, tiltValue, zoomValue = 128, irisValue = 255 }: { panValue: number; tiltValue: number; zoomValue?: number; irisValue?: number }) {
  const baseRef = useRef<THREE.Group>(null);
  const panArmRef = useRef<THREE.Group>(null);
  const fixtureHeadRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const lensRef = useRef<THREE.Mesh>(null);

  // Convert DMX values to angles
  // Pan: 0-255 maps to -180° to +180° (540° total range)
  // Tilt: 0-255 maps to -90° to +90° (180° total range)
  const panAngle = useMemo(() => {
    return ((panValue - 128) / 128) * Math.PI; // -π to +π
  }, [panValue]);

  const tiltAngle = useMemo(() => {
    return ((tiltValue - 128) / 128) * (Math.PI / 2); // -π/2 to +π/2
  }, [tiltValue]);

  // Zoom: 0-255 maps to beam length (0.3 to 1.5)
  const beamLength = useMemo(() => {
    return 0.3 + (zoomValue / 255) * 1.2;
  }, [zoomValue]);

  // Iris: 0-255 maps to lens opening size (0.08 to 0.15)
  const lensSize = useMemo(() => {
    return 0.08 + (irisValue / 255) * 0.07;
  }, [irisValue]);

  // Animate smooth rotation
  useFrame(() => {
    if (panArmRef.current) {
      panArmRef.current.rotation.y = panAngle;
    }
    if (fixtureHeadRef.current) {
      fixtureHeadRef.current.rotation.x = -tiltAngle; // Negative for correct tilt direction
    }
    if (beamRef.current) {
      // Update beam length based on zoom
      beamRef.current.scale.z = beamLength / 0.8; // Scale relative to default length
      // Animate beam intensity/pulse
      const intensity = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
      if (beamRef.current.material instanceof THREE.MeshStandardMaterial) {
        beamRef.current.material.emissiveIntensity = intensity;
      }
    }
    if (lensRef.current) {
      // Update lens size based on iris
      lensRef.current.scale.set(lensSize / 0.12, lensSize / 0.12, 1);
    }
  });

  return (
    <group>
      {/* Base stand - Pixar lamp style (wider, more stable) */}
      <group ref={baseRef} position={[0, -0.5, 0]}>
        {/* Base cylinder */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.25, 0.6, 16]} />
          <meshStandardMaterial color="#4a4a5a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Base ring/trim */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <torusGeometry args={[0.25, 0.02, 8, 16]} />
          <meshStandardMaterial color="#6a6a7a" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Pan arm (rotates around Y axis) - Pixar lamp style curved arm */}
      <group ref={panArmRef} position={[0, -0.2, 0]}>
        {/* Pan joint - larger, more prominent */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#e8e8f0" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Curved arm - Pixar lamp style (bent tube) */}
        <group position={[0.15, 0.1, 0]}>
          {/* Lower part of arm */}
          <mesh position={[0, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 12]} />
            <meshStandardMaterial color="#a0a0b0" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Curved joint */}
          <mesh position={[0.15, 0.1, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.2, 12]} />
            <meshStandardMaterial color="#a0a0b0" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Upper part of arm */}
          <mesh position={[0.3, 0.2, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.25, 12]} />
            <meshStandardMaterial color="#a0a0b0" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>

        {/* Fixture head (at end of arm, rotates around local X axis for tilt) - Pixar lamp style */}
        <group ref={fixtureHeadRef} position={[0.45, 0.35, 0]}>
          {/* Fixture head body - more rounded, Pixar lamp style */}
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.25, 0.3]} />
            <meshStandardMaterial color="#d0d0e8" metalness={0.7} roughness={0.3} />
          </mesh>
          
          {/* Rounded corners (simplified) */}
          <mesh position={[0.15, 0, 0]} castShadow>
            <sphereGeometry args={[0.125, 16, 16]} />
            <meshStandardMaterial color="#d0d0e8" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Lens (front face) - Pixar lamp style large eye */}
          <mesh ref={lensRef} position={[0.15, 0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.03, 32]} />
            <meshStandardMaterial 
              color="#ffff88" 
              emissive="#ffff88" 
              emissiveIntensity={1.0}
              metalness={0.3}
              roughness={0.1}
            />
          </mesh>
          
          {/* Lens highlight/reflection */}
          <mesh position={[0.18, 0.05, 0]} castShadow>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial 
              color="#ffffff" 
              emissive="#ffffff" 
              emissiveIntensity={1.5}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Light beam (cone) - rotated to point forward from lens along +X axis */}
          <mesh ref={beamRef} position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[lensSize * 1.2, beamLength, 16]} />
            <meshStandardMaterial
              color="#ffd700"
              transparent
              opacity={0.4}
              emissive="#ffd700"
              emissiveIntensity={1.5}
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
  zoomValue = 128,
  irisValue = 255,
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
        {/* Enhanced lighting for better Pixar lamp look */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.5} />
        <pointLight position={[-5, 5, -5]} intensity={0.6} />
        <spotLight position={[2, 3, 2]} angle={0.3} penumbra={0.5} intensity={0.8} castShadow />

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
        <MovingHeadFixture 
          panValue={panValue} 
          tiltValue={tiltValue} 
          zoomValue={zoomValue}
          irisValue={irisValue}
        />

        {/* Grid helper */}
        <gridHelper args={[2, 20, '#444', '#222']} />
      </Canvas>
    </div>
  );
};

