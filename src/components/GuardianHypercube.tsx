import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface GuardianHypercubeProps {
    theme: 'day' | 'night';
}

function RotatingHypercube({ theme }: GuardianHypercubeProps) {
    const meshRef = useRef<Mesh>(null);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.5;
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    // Color Logic
    // Day: White (User Request) - Contrasts with the dark button background.
    // Night: Deep Sky Blue.
    const color = theme === 'day' ? '#ffffff' : '#0284c7';
    const emissive = theme === 'day' ? '#ffffff' : '#0284c7';

    return (
        <mesh ref={meshRef}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
                wireframe={true}
                color={color}
                emissive={emissive}
                emissiveIntensity={theme === 'day' ? 0.6 : 0.8}
            />
        </mesh>
    );
}

export function GuardianHypercube({ theme }: GuardianHypercubeProps) {
    return (
        <div className="w-full h-full">
            <Canvas camera={{ position: [0, 0, 2.5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <RotatingHypercube theme={theme} />
            </Canvas>
        </div>
    );
}
