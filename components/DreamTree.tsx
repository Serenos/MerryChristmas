import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppMode, TreeState } from '../types';
import { COLORS, COUNTS, tempObject, tempColor, random } from '../constants';
import { Sparkles, Float } from '@react-three/drei';

interface DreamTreeProps {
  appState: TreeState;
}

const DreamTree: React.FC<DreamTreeProps> = ({ appState }) => {
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const ornamentsRef = useRef<THREE.InstancedMesh>(null);
  const ribbonRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // --- Data Generation ---
  const leafData = useMemo(() => {
    const positionsTree = new Float32Array(COUNTS.leaves * 3);
    const positionsExplode = new Float32Array(COUNTS.leaves * 3);
    const colors = new Float32Array(COUNTS.leaves * 3);
    const scales = new Float32Array(COUNTS.leaves);

    for (let i = 0; i < COUNTS.leaves; i++) {
      // Tree Shape (Cone)
      const theta = Math.random() * Math.PI * 2;
      const h = Math.random() * 10; // Height 0 to 10
      const maxR = (10 - h) * 0.4; // Radius shrinks as we go up
      const r = Math.random() * maxR;
      
      positionsTree[i * 3] = r * Math.cos(theta);
      positionsTree[i * 3 + 1] = h - 5; // Center Y
      positionsTree[i * 3 + 2] = r * Math.sin(theta);

      // Explode Shape (Sphere cloud)
      const phi = Math.acos(-1 + (2 * i) / COUNTS.leaves);
      const thetaExp = Math.sqrt(COUNTS.leaves * Math.PI) * phi;
      const rExp = 8 + Math.random() * 5;
      
      positionsExplode[i * 3] = rExp * Math.cos(thetaExp) * Math.sin(phi);
      positionsExplode[i * 3 + 1] = rExp * Math.cos(phi);
      positionsExplode[i * 3 + 2] = rExp * Math.sin(thetaExp) * Math.sin(phi);

      // Colors & Scale
      const color = new THREE.Color(Math.random() > 0.5 ? COLORS.leaf1 : COLORS.leaf2);
      color.toArray(colors, i * 3);
      scales[i] = random(0.05, 0.15);
    }
    return { positionsTree, positionsExplode, colors, scales };
  }, []);

  const ornamentData = useMemo(() => {
    const count = COUNTS.ornaments;
    const posTree = new Float32Array(count * 3);
    const posExplode = new Float32Array(count * 3);
    
    for(let i=0; i<count; i++) {
        // Tree: On the surface
        const theta = Math.random() * Math.PI * 2;
        const h = Math.random() * 10;
        const r = ((10 - h) * 0.4) + 0.2; // Slightly outside
        
        posTree[i*3] = r * Math.cos(theta);
        posTree[i*3+1] = h - 5;
        posTree[i*3+2] = r * Math.sin(theta);

        // Explode
        posExplode[i*3] = (Math.random() - 0.5) * 25;
        posExplode[i*3+1] = (Math.random() - 0.5) * 25;
        posExplode[i*3+2] = (Math.random() - 0.5) * 25;
    }
    return { posTree, posExplode };
  }, []);

  const ribbonData = useMemo(() => {
     const count = COUNTS.ribbon;
     const posTree = new Float32Array(count * 3);
     const posExplode = new Float32Array(count * 3);

     for(let i=0; i<count; i++) {
        // Spiral
        const t = i / count; // 0 to 1
        const loops = 3.5;
        const h = t * 10;
        const angle = t * Math.PI * 2 * loops;
        const r = ((10 - h) * 0.45) + 0.3; // Outside ornaments

        posTree[i*3] = r * Math.cos(angle);
        posTree[i*3+1] = h - 5;
        posTree[i*3+2] = r * Math.sin(angle);

        // Explode: Random lines
        posExplode[i*3] = (Math.random() - 0.5) * 20;
        posExplode[i*3+1] = (Math.random() - 0.5) * 20;
        posExplode[i*3+2] = (Math.random() - 0.5) * 20;
     }
     return { posTree, posExplode };
  }, []);


  // --- Animation Loop ---
  useFrame((state, delta) => {
    // 1. Group Rotation
    if (groupRef.current) {
        // Automatic slow rotation + Gesture offset
        groupRef.current.rotation.y += delta * 0.1; 
        
        // Smoothly interpolate the gesture rotation
        const targetRot = appState.rotationOffset;
        // Simple dampening logic could go here, but we apply offset directly for responsiveness
        // To make it additive, we'd need more complex state. 
        // For now, we mix the continuous rotation with the gesture offset.
        groupRef.current.rotation.y = (state.clock.elapsedTime * 0.1) + (targetRot * 2);
    }

    // 2. Particle Lerp Factor
    // If Tree, target 0. If Explode, target 1.
    const targetLerp = appState.mode === AppMode.EXPLODE ? 1 : 0;
    // We store the current lerp value in a userData property on the group to persist it across frames
    if (groupRef.current) {
        groupRef.current.userData.lerpVal = THREE.MathUtils.lerp(
            groupRef.current.userData.lerpVal || 0,
            targetLerp,
            delta * 2 // Speed of transition
        );
    }
    const t = groupRef.current?.userData.lerpVal || 0;

    // 3. Update Instanced Meshes
    // Leaves
    if (leavesRef.current) {
      for (let i = 0; i < COUNTS.leaves; i++) {
        const x = THREE.MathUtils.lerp(leafData.positionsTree[i * 3], leafData.positionsExplode[i * 3], t);
        const y = THREE.MathUtils.lerp(leafData.positionsTree[i * 3 + 1], leafData.positionsExplode[i * 3 + 1], t);
        const z = THREE.MathUtils.lerp(leafData.positionsTree[i * 3 + 2], leafData.positionsExplode[i * 3 + 2], t);
        
        // Add some noise/floating effect
        const noise = Math.sin(state.clock.elapsedTime + i) * 0.05 * t;

        tempObject.position.set(x + noise, y + noise, z + noise);
        
        // Rotate leaves to look dynamic
        tempObject.rotation.set(time(i) + t, time(i) + t, time(i));
        tempObject.scale.setScalar(leafData.scales[i]);
        tempObject.updateMatrix();
        leavesRef.current.setMatrixAt(i, tempObject.matrix);
      }
      leavesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Ornaments
    if (ornamentsRef.current) {
        for(let i=0; i<COUNTS.ornaments; i++) {
            const x = THREE.MathUtils.lerp(ornamentData.posTree[i*3], ornamentData.posExplode[i*3], t);
            const y = THREE.MathUtils.lerp(ornamentData.posTree[i*3+1], ornamentData.posExplode[i*3+1], t);
            const z = THREE.MathUtils.lerp(ornamentData.posTree[i*3+2], ornamentData.posExplode[i*3+2], t);
            
            tempObject.position.set(x, y, z);
            tempObject.rotation.set(time(i), time(i), 0);
            tempObject.scale.setScalar(0.12);
            tempObject.updateMatrix();
            ornamentsRef.current.setMatrixAt(i, tempObject.matrix);
        }
        ornamentsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Ribbon
    if (ribbonRef.current) {
        for(let i=0; i<COUNTS.ribbon; i++) {
            const x = THREE.MathUtils.lerp(ribbonData.posTree[i*3], ribbonData.posExplode[i*3], t);
            const y = THREE.MathUtils.lerp(ribbonData.posTree[i*3+1], ribbonData.posExplode[i*3+1], t);
            const z = THREE.MathUtils.lerp(ribbonData.posTree[i*3+2], ribbonData.posExplode[i*3+2], t);

            tempObject.position.set(x, y, z);
            // Orient along the path roughly
            tempObject.lookAt(0, y + 1, 0); 
            tempObject.scale.setScalar(0.04);
            tempObject.updateMatrix();
            ribbonRef.current.setMatrixAt(i, tempObject.matrix);
        }
        ribbonRef.current.instanceMatrix.needsUpdate = true;
    }

  });

  const time = (i: number) => i * 0.1;

  // Set initial colors for leaves
  useLayoutEffect(() => {
    if (leavesRef.current) {
        for (let i = 0; i < COUNTS.leaves; i++) {
            tempColor.fromArray(leafData.colors, i * 3);
            leavesRef.current.setColorAt(i, tempColor);
        }
        leavesRef.current.instanceColor!.needsUpdate = true;
    }
    if (ornamentsRef.current) {
        for(let i=0; i<COUNTS.ornaments; i++) {
             // Mix of white and lavender
             tempColor.set(Math.random() > 0.7 ? COLORS.ornament2 : COLORS.ornament1);
             ornamentsRef.current.setColorAt(i, tempColor);
        }
        ornamentsRef.current.instanceColor!.needsUpdate = true;
    }
  }, [leafData, ornamentData]);


  return (
    <group ref={groupRef}>
      {/* Leaves - Octahedrons */}
      <instancedMesh ref={leavesRef} args={[undefined, undefined, COUNTS.leaves]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
            roughness={0.4} 
            metalness={0.6} 
            flatShading={true}
        />
      </instancedMesh>

      {/* Ornaments - Icosahedrons/Cubes */}
      <instancedMesh ref={ornamentsRef} args={[undefined, undefined, COUNTS.ornaments]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
            roughness={0.1} 
            metalness={0.9} 
            emissive={COLORS.ornament2}
            emissiveIntensity={0.2}
        />
      </instancedMesh>

      {/* Ribbon - Tetrahedrons */}
      <instancedMesh ref={ribbonRef} args={[undefined, undefined, COUNTS.ribbon]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffffff"
            emissiveIntensity={0.8}
            toneMapped={false} 
        />
      </instancedMesh>

      {/* Top Star */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 5.2, 0]}>
             <mesh>
                <coneGeometry args={[0.5, 1.5, 5]} />
                <meshStandardMaterial 
                    color={COLORS.star} 
                    emissive={COLORS.star} 
                    emissiveIntensity={2} 
                    toneMapped={false}
                />
            </mesh>
            <Sparkles count={50} scale={3} size={4} speed={0.4} opacity={0.7} color="#FFF" />
            <pointLight distance={5} intensity={5} color={COLORS.star} />
        </group>
      </Float>

    </group>
  );
};

export default DreamTree;
