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

// Moving head fixture component - Professional DMX moving head style
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

  // Zoom: 0-255 maps to beam length (0.5 to 2.0)
  const beamLength = useMemo(() => {
    return 0.5 + (zoomValue / 255) * 1.5;
  }, [zoomValue]);

  // Iris: 0-255 maps to lens opening size (0.06 to 0.14)
  const lensSize = useMemo(() => {
    return 0.06 + (irisValue / 255) * 0.08;
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
      beamRef.current.scale.z = beamLength / 1.0; // Scale relative to default length
      // Subtle beam intensity (no pulsing for professional look)
      if (beamRef.current.material instanceof THREE.MeshStandardMaterial) {
        beamRef.current.material.emissiveIntensity = 1.2;
      }
    }
    if (lensRef.current) {
      // Update lens size based on iris
      lensRef.current.scale.set(lensSize / 0.10, lensSize / 0.10, 1);
    }
  });

  // Professional DMX fixture colors
  const baseColor = "#1a1a1a"; // Black base
  const fixtureColor = "#2a2a2a"; // Dark gray fixture body
  const trimColor = "#3a3a3a"; // Slightly lighter for trim/accents
  const lensColor = "#ffffff"; // White lens
  const beamColor = "#ffaa00"; // Warm white/orange beam

  return (
    <group>
      {/* Base stand - Professional DMX fixture style (angular, industrial) */}
      <group ref={baseRef} position={[0, -0.5, 0]}>
        {/* Main base cylinder - more compact and industrial */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.18, 0.5, 16]} />
          <meshStandardMaterial color={baseColor} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Base mounting plate */}
        <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
          <meshStandardMaterial color={trimColor} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Pan motor housing (top of base) */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.15, 16]} />
          <meshStandardMaterial color={fixtureColor} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Pan arm (rotates around Y axis) - Professional straight arm */}
      <group ref={panArmRef} position={[0, -0.15, 0]}>
        {/* Pan joint - compact motor housing */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
          <meshStandardMaterial color={fixtureColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Straight horizontal arm - professional DMX style */}
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.08]} />
          <meshStandardMaterial color={fixtureColor} metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Arm reinforcement/trim */}
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.5, 0.1, 0.1]} />
          <meshStandardMaterial color={trimColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Tilt motor housing (at end of arm) */}
        <mesh position={[0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshStandardMaterial color={fixtureColor} metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Fixture head (at end of arm, rotates around local X axis for tilt) - Professional DMX style */}
        <group ref={fixtureHeadRef} position={[0.5, 0, 0]}>
          {/* Main fixture body - angular, boxy design */}
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.28, 0.28]} />
            <meshStandardMaterial color={fixtureColor} metalness={0.7} roughness={0.3} />
          </mesh>
          
          {/* Cooling fins/ventilation on top */}
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[0, 0.16, -0.1 + (i * 0.05)]} castShadow>
              <boxGeometry args={[0.3, 0.02, 0.02]} />
              <meshStandardMaterial color={trimColor} metalness={0.6} roughness={0.4} />
            </mesh>
          ))}

          {/* Side panels with mounting points */}
          <mesh position={[0, 0, 0.14]} castShadow>
            <boxGeometry args={[0.35, 0.28, 0.02]} />
            <meshStandardMaterial color={trimColor} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.14]} castShadow>
            <boxGeometry args={[0.35, 0.28, 0.02]} />
            <meshStandardMaterial color={trimColor} metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Lens assembly - professional design */}
          <group position={[0.18, 0, 0]}>
            {/* Lens bezel/trim ring */}
            <mesh castShadow>
              <torusGeometry args={[lensSize + 0.02, 0.01, 16, 32]} />
              <meshStandardMaterial color={trimColor} metalness={0.9} roughness={0.1} />
            </mesh>
            
            {/* Main lens glass */}
            <mesh ref={lensRef} castShadow>
              <cylinderGeometry args={[lensSize, lensSize, 0.02, 32]} />
              <meshStandardMaterial 
                color={lensColor}
                emissive={lensColor}
                emissiveIntensity={0.8}
                metalness={0.1}
                roughness={0.05}
                transparent
                opacity={0.95}
              />
            </mesh>
            
            {/* Inner lens reflection/highlight */}
            <mesh position={[0.01, 0.02, 0]} castShadow>
              <sphereGeometry args={[lensSize * 0.3, 16, 16]} />
              <meshStandardMaterial 
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={1.0}
                transparent
                opacity={0.6}
              />
            </mesh>
          </group>

          {/* Light beam (cone) - professional beam visualization */}
          <mesh ref={beamRef} position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[lensSize * 1.5, beamLength, 16]} />
            <meshStandardMaterial
              color={beamColor}
              transparent
              opacity={0.35}
              emissive={beamColor}
              emissiveIntensity={1.2}
            />
          </mesh>
        </group>
      </group>

      {/* Ground plane for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#0a0a0a" />
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
        {/* Professional lighting setup for DMX fixture visualization */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        <spotLight position={[2, 3, 2]} angle={0.3} penumbra={0.5} intensity={0.6} castShadow />

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

