import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import styles from './Fixture3DModel.module.scss';

interface Fixture3DModelProps {
  panValue: number; // 0-255 DMX value
  tiltValue: number; // 0-255 DMX value
  zoomValue?: number; // 0-255 DMX value (optional)
  irisValue?: number; // 0-255 DMX value (optional)
  focusValue?: number; // 0-255 DMX value (optional)
  width?: number;
  height?: number;
  className?: string;
}

// Professional DMX Moving Head Fixture - Complete redesign
function MovingHeadFixture({ 
  panValue, 
  tiltValue, 
  zoomValue = 128, 
  irisValue = 255,
  focusValue = 128
}: { 
  panValue: number; 
  tiltValue: number; 
  zoomValue?: number; 
  irisValue?: number;
  focusValue?: number;
}) {
  const baseRef = useRef<THREE.Group>(null);
  const panYokeRef = useRef<THREE.Group>(null);
  const tiltHeadRef = useRef<THREE.Group>(null);
  const zoomLensRef = useRef<THREE.Group>(null);
  const irisBladesRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  // Convert DMX values to real-world parameters
  // Pan: 0-255 maps to 0-360° (continuous rotation)
  const panAngle = useMemo(() => {
    return (panValue / 255) * Math.PI * 2; // 0 to 2π (360°)
  }, [panValue]);

  // Tilt: 0-255 maps to -135° to +135° (270° total range, typical for moving heads)
  const tiltAngle = useMemo(() => {
    return ((tiltValue / 255) - 0.5) * Math.PI * 1.5; // -135° to +135°
  }, [tiltValue]);

  // Zoom: 0-255 maps to lens position (0.0 to 0.15 forward movement) and beam angle (60° to 5°)
  const zoomPosition = useMemo(() => {
    return (zoomValue / 255) * 0.15; // Lens moves forward for zoom
  }, [zoomValue]);

  const beamAngle = useMemo(() => {
    // Narrower beam = more zoom (smaller angle)
    return (60 - (zoomValue / 255) * 55) * (Math.PI / 180); // 60° to 5° in radians
  }, [zoomValue]);

  // Iris: 0-255 maps to iris opening (closed to fully open)
  // 0 = fully closed, 255 = fully open
  const irisOpening = useMemo(() => {
    return irisValue / 255; // 0.0 to 1.0
  }, [irisValue]);

  // Focus: 0-255 maps to focus blur (not visually represented but could affect beam)
  const focusBlur = useMemo(() => {
    return focusValue / 255;
  }, [focusValue]);

  // Animate all mechanisms smoothly
  useFrame(() => {
    // Pan rotation (base rotates around Y axis)
    if (panYokeRef.current) {
      panYokeRef.current.rotation.y = panAngle;
    }

    // Tilt rotation (head rotates around local X axis)
    if (tiltHeadRef.current) {
      tiltHeadRef.current.rotation.x = -tiltAngle; // Negative for correct direction
    }

    // Zoom - lens moves forward/back
    if (zoomLensRef.current) {
      zoomLensRef.current.position.z = zoomPosition;
    }

    // Update beam based on zoom (beam angle changes)
    if (beamRef.current) {
      // Beam cone angle changes with zoom
      const baseRadius = 0.12;
      const beamLength = 1.5;
      const currentAngle = beamAngle;
      const beamRadius = Math.tan(currentAngle / 2) * beamLength;
      
      beamRef.current.scale.set(
        beamRadius / baseRadius,
        beamRadius / baseRadius,
        beamLength / 1.5
      );
      
      // Beam intensity based on iris opening
      if (beamRef.current.material instanceof THREE.MeshStandardMaterial) {
        beamRef.current.material.emissiveIntensity = 0.8 + (irisOpening * 0.4);
        beamRef.current.material.opacity = 0.3 + (irisOpening * 0.15);
      }
    }
  });

  // Professional DMX fixture colors - bright and visible
  const baseColor = "#3a3a4a";
  const yokeColor = "#5a5a6a";
  const headColor = "#7a7a8a";
  const trimColor = "#9a9aaa";
  const lensColor = "#ffffff";
  const irisColor = "#2a2a2a";
  const beamColor = "#ffdd44";

  // Create iris blades (6 blades for realistic iris)
  const irisBlades = useMemo(() => {
    const blades = [];
    const bladeCount = 6;
    const maxRadius = 0.10;
    const minRadius = 0.02;
    const currentRadius = minRadius + (irisOpening * (maxRadius - minRadius));
    
    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2;
      const bladeRotation = angle + (irisOpening < 0.5 ? Math.PI / 2 : 0);
      
      blades.push(
        <mesh
          key={i}
          position={[
            Math.cos(angle) * (currentRadius * 0.5),
            Math.sin(angle) * (currentRadius * 0.5),
            0
          ]}
          rotation={[0, 0, bladeRotation]}
        >
          <boxGeometry args={[currentRadius * 1.5, 0.005, 0.01]} />
          <meshStandardMaterial 
            color={irisColor} 
            metalness={0.9} 
            roughness={0.1}
            emissive="#1a1a1a"
            emissiveIntensity={0.2}
          />
        </mesh>
      );
    }
    return blades;
  }, [irisOpening, irisColor]);

  return (
    <group>
      {/* Base Stand - Mounting base with pan motor */}
      <group ref={baseRef} position={[0, -0.6, 0]}>
        {/* Base plate - mounting surface */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.20, 0.20, 0.08, 16]} />
          <meshStandardMaterial color={baseColor} metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Base column */}
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.14, 0.16, 0.25, 16]} />
          <meshStandardMaterial color={baseColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Pan motor housing */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.12, 16]} />
          <meshStandardMaterial color={yokeColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Pan motor indicator ring */}
        <mesh position={[0, 0.24, 0]} castShadow>
          <torusGeometry args={[0.13, 0.01, 8, 16]} />
          <meshStandardMaterial color={trimColor} metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Pan Yoke - Rotates around Y axis for pan movement */}
      <group ref={panYokeRef} position={[0, -0.3, 0]}>
        {/* Yoke base connection */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.08, 16]} />
          <meshStandardMaterial color={yokeColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Yoke arm - horizontal support */}
        <mesh position={[0.3, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.6, 0.06, 0.06]} />
          <meshStandardMaterial color={yokeColor} metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Yoke reinforcement */}
        <mesh position={[0.3, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.6, 0.08, 0.08]} />
          <meshStandardMaterial color={trimColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Tilt motor housing (at end of yoke) */}
        <mesh position={[0.6, 0.15, 0]} castShadow>
          <boxGeometry args={[0.10, 0.10, 0.10]} />
          <meshStandardMaterial color={yokeColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Tilt Head - Rotates around local X axis for tilt movement */}
        <group ref={tiltHeadRef} position={[0.6, 0.15, 0]}>
          {/* Head body - main fixture housing */}
          <mesh castShadow>
            <boxGeometry args={[0.40, 0.32, 0.32]} />
            <meshStandardMaterial color={headColor} metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Head front panel */}
          <mesh position={[0.20, 0, 0]} castShadow>
            <boxGeometry args={[0.02, 0.32, 0.32]} />
            <meshStandardMaterial color={trimColor} metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Cooling vents on top */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh 
              key={i} 
              position={[0, 0.18, -0.12 + (i * 0.04)]} 
              castShadow
            >
              <boxGeometry args={[0.35, 0.015, 0.02]} />
              <meshStandardMaterial color={trimColor} metalness={0.6} roughness={0.4} />
            </mesh>
          ))}

          {/* Side panels */}
          <mesh position={[0, 0, 0.16]} castShadow>
            <boxGeometry args={[0.40, 0.32, 0.02]} />
            <meshStandardMaterial color={trimColor} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.16]} castShadow>
            <boxGeometry args={[0.40, 0.32, 0.02]} />
            <meshStandardMaterial color={trimColor} metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Lens Assembly - Zoom mechanism moves this forward/back */}
          <group ref={zoomLensRef} position={[0.21, 0, 0]}>
            {/* Lens housing */}
            <mesh castShadow>
              <cylinderGeometry args={[0.13, 0.13, 0.08, 32]} />
              <meshStandardMaterial color={trimColor} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Lens bezel ring */}
            <mesh position={[0, 0, 0.04]} castShadow>
              <torusGeometry args={[0.13, 0.008, 16, 32]} />
              <meshStandardMaterial color={trimColor} metalness={0.95} roughness={0.05} />
            </mesh>

            {/* Iris mechanism - visible blades */}
            <group ref={irisBladesRef} position={[0, 0, 0.02]}>
              {irisBlades}
              
              {/* Iris housing ring */}
              <mesh castShadow>
                <torusGeometry args={[0.10, 0.003, 16, 32]} />
                <meshStandardMaterial 
                  color={irisColor} 
                  metalness={0.9} 
                  roughness={0.1}
                />
              </mesh>
            </group>

            {/* Main lens glass */}
            <mesh position={[0, 0, 0.01]} castShadow>
              <cylinderGeometry args={[0.10, 0.10, 0.02, 32]} />
              <meshStandardMaterial 
                color={lensColor}
                emissive={lensColor}
                emissiveIntensity={0.6}
                metalness={0.1}
                roughness={0.05}
                transparent
                opacity={0.9}
              />
            </mesh>

            {/* Lens reflection highlight */}
            <mesh position={[0.005, 0.015, 0.015]} castShadow>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshStandardMaterial 
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={1.2}
                transparent
                opacity={0.7}
              />
            </mesh>
          </group>

          {/* Light beam - cone that changes angle with zoom */}
          <mesh 
            ref={beamRef} 
            position={[0.5, 0, 0]} 
            rotation={[0, 0, -Math.PI / 2]}
          >
            <coneGeometry args={[0.12, 1.5, 16, 1, true]} />
            <meshStandardMaterial
              color={beamColor}
              transparent
              opacity={0.35}
              emissive={beamColor}
              emissiveIntensity={1.0}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </group>

      {/* Ground plane for shadows and reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#0f0f0f" />
      </mesh>
    </group>
  );
}

export const Fixture3DModel: React.FC<Fixture3DModelProps> = ({
  panValue,
  tiltValue,
  zoomValue = 128,
  irisValue = 255,
  focusValue = 128,
  width = 400,
  height = 400,
  className
}) => {
  return (
    <div className={`${styles.fixture3DContainer} ${className || ''}`} style={{ width, height }}>
      <Canvas
        shadows
        camera={{ position: [1.8, 0.6, 1.8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Professional lighting setup */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={2.0} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.9} />
        <pointLight position={[-5, 5, -5]} intensity={0.8} />
        <spotLight position={[2, 3, 2]} angle={0.3} penumbra={0.5} intensity={1.2} castShadow />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.2}
          maxDistance={5}
          autoRotate={false}
        />

        {/* Fixture model */}
        <MovingHeadFixture 
          panValue={panValue} 
          tiltValue={tiltValue} 
          zoomValue={zoomValue}
          irisValue={irisValue}
          focusValue={focusValue}
        />

        {/* Grid helper - positioned below fixture */}
        <gridHelper args={[2, 20, '#555', '#333']} position={[0, -0.8, 0]} />
      </Canvas>
    </div>
  );
};
