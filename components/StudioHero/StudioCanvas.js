"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function StudioCanvas({
  onQuaternionUpdate,
  onScaleUpdate,
  resetTrigger,
}) {
  const mountRef = useRef(null);
  const meshRef = useRef(null);
  const ringRef = useRef(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentMouseRotRef = useRef({ x: 0, y: 0 });
  const scrollYRef = useRef(0);
  const currentScaleRef = useRef(1.0);
  const scrollRotRef = useRef({ x: 0, y: 0, z: 0 });

  // Handle Reset Quaternion trigger
  useEffect(() => {
    if (resetTrigger) {
      targetRotationRef.current = { x: 0, y: 0 };
      currentMouseRotRef.current = { x: 0, y: 0 };
      mouseRef.current = { x: 0, y: 0 };
      scrollRotRef.current = { x: 0, y: 0, z: 0 };
      if (meshRef.current) {
        meshRef.current.quaternion.set(0, 0, 0, 1);
        if (onQuaternionUpdate) {
          onQuaternionUpdate({
            x: ".00",
            y: ".00",
            z: ".00",
            w: "1.0",
          });
        }
      }
    }
  }, [resetTrigger, onQuaternionUpdate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7.5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 2. Monolithic 3D Architectural Letter "A" Artifact (Replaces Octahedron)
    const aShape = new THREE.Shape();
    // Outer boundary of "A"
    aShape.moveTo(-2.0, -2.0);
    aShape.lineTo(-1.15, -2.0);
    aShape.lineTo(-0.5, -0.65);
    aShape.lineTo(0.5, -0.65);
    aShape.lineTo(1.15, -2.0);
    aShape.lineTo(2.0, -2.0);
    aShape.lineTo(0.55, 2.2);
    aShape.lineTo(-0.55, 2.2);
    aShape.closePath();

    // Inner triangular counter (hole) of "A"
    const aHole = new THREE.Path();
    aHole.moveTo(-0.4, -0.05);
    aHole.lineTo(0.4, -0.05);
    aHole.lineTo(0, 1.4);
    aHole.closePath();
    aShape.holes.push(aHole);

    // Extrude into a heavy 3D monolith with chamfered bevels
    const aGeometry = new THREE.ExtrudeGeometry(aShape, {
      depth: 0.65,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    });
    aGeometry.center(); // Center geometric mass to (0, 0, 0)

    // Ultra-high-end refractive glass material
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.22,
      roughness: 0.08,
      transmission: 0.93, // High-end glass refraction
      ior: 1.58,
      thickness: 2.4,
      transparent: true,
      opacity: 0.96,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    });

    const letterAMesh = new THREE.Mesh(aGeometry, glassMaterial);
    scene.add(letterAMesh);
    meshRef.current = letterAMesh;

    // Laser Cyan Wireframe Edges outlining the 3D "A" contours
    const edgesGeometry = new THREE.EdgesGeometry(aGeometry, 22);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.85,
    });
    const edgeLines = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    letterAMesh.add(edgeLines);

    // 3. Outer Holographic Gyro Ring Orbiting the Monolith
    const ringGeometry = new THREE.TorusGeometry(3.3, 0.022, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x4facfe,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    letterAMesh.add(ringMesh);
    ringRef.current = ringMesh;

    // 5. Electric Blue & Cyan Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f2fe, 18, 35);
    cyanLight.position.set(5, 4, 6);
    scene.add(cyanLight);

    const blueLight = new THREE.PointLight(0x0055ff, 22, 35);
    blueLight.position.set(-6, -4, 5);
    scene.add(blueLight);

    const rimLight = new THREE.PointLight(0xffffff, 14, 30);
    rimLight.position.set(0, 6, -5);
    scene.add(rimLight);

    // 6. Ambient Infinite Floor Grid
    const grid = new THREE.GridHelper(50, 50, 0x3f3f46, 0x18181b);
    grid.position.y = -3.8;
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    scene.add(grid);

    // 7. Ambient Dust Starfield
    const particleCount = 180;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 50;
      positions[i + 1] = (Math.random() - 0.5) * 35;
      positions[i + 2] = (Math.random() - 0.5) * 35;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.2,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 8. Mouse Move Listener for Subtle Parallax
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = -(e.clientY / window.innerHeight - 0.5) * 2;
      mouseRef.current = { x, y };
      targetRotationRef.current = {
        x: y * 0.22,
        y: x * 0.32,
      };
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 9. Scroll Listener for Dynamic Scale & Rotation
    const handleScroll = () => {
      scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // 10. Resize Observer
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // 11. Animation Loop
    let animationFrameId;
    let frameCount = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      frameCount++;
      const elapsed = clock.getElapsedTime();
      const scrollY = scrollYRef.current;

      if (letterAMesh) {
        // --- SCROLL DRIVEN SCALE (BIG "A" GETS BIGGER AS YOU SCROLL) ---
        // Smoothly scales from 1.0x up to 2.35x as user scrolls through the page
        const maxScale = 2.35;
        const scrollFactor = Math.min(scrollY / 850, 1.0);
        const targetScale = 1.0 + scrollFactor * (maxScale - 1.0);
        currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.08;
        const currentScale = currentScaleRef.current;
        letterAMesh.scale.set(currentScale, currentScale, currentScale);

        // --- GENTLE SCROLL DRIVEN ROTATION (LOW SENSITIVITY) ---
        const targetRotY = scrollY * 0.0009;
        const targetRotX = scrollY * 0.0005;
        const targetRotZ = scrollY * 0.00035;

        scrollRotRef.current.x += (targetRotX - scrollRotRef.current.x) * 0.05;
        scrollRotRef.current.y += (targetRotY - scrollRotRef.current.y) * 0.05;
        scrollRotRef.current.z += (targetRotZ - scrollRotRef.current.z) * 0.05;

        // Smoothly damped mouse parallax (eliminates sudden snapping)
        currentMouseRotRef.current.x += (targetRotationRef.current.x - currentMouseRotRef.current.x) * 0.05;
        currentMouseRotRef.current.y += (targetRotationRef.current.y - currentMouseRotRef.current.y) * 0.05;

        // Base majestic slow rotation + smoothed mouse parallax + gentle scroll rotation
        const baseIdleRotY = elapsed * 0.07;
        letterAMesh.rotation.y = baseIdleRotY + currentMouseRotRef.current.y + scrollRotRef.current.y;
        letterAMesh.rotation.x = currentMouseRotRef.current.x + scrollRotRef.current.x;
        letterAMesh.rotation.z = scrollRotRef.current.z;

        // Floating hover motion + subtle vertical shift with scroll
        letterAMesh.position.y = Math.sin(elapsed * 0.8) * 0.08 - Math.min(scrollFactor * 0.35, 0.6);

        // Gyro ring tilts and rotates gently with scroll momentum
        if (ringMesh) {
          ringMesh.rotation.x = Math.PI / 4 + Math.sin(elapsed * 0.4) * 0.15 + scrollRotRef.current.x * 0.5;
          ringMesh.rotation.z = elapsed * 0.12 + scrollRotRef.current.y * 0.4;
        }

        // Ambient grid moves subtly with scroll
        grid.position.z = (elapsed * 0.4 + scrollY * 0.005) % 2;

        // Dynamic light intensity shift on scroll
        cyanLight.intensity = 18 + scrollFactor * 10;
        blueLight.intensity = 22 + scrollFactor * 12;

        // Throttled HUD updates (every 4 frames ~15fps) to maintain silky 60fps render
        if (frameCount % 4 === 0) {
          if (onQuaternionUpdate) {
            const q = letterAMesh.quaternion;
            const formatCoord = (num) =>
              num >= 0
                ? `.${Math.abs(Math.round(num * 100)).toString().padStart(2, "0")}`
                : `-.${Math.abs(Math.round(num * 100)).toString().padStart(2, "0")}`;
            onQuaternionUpdate({
              x: formatCoord(q.x),
              y: formatCoord(q.y),
              z: formatCoord(q.z),
              w: q.w.toFixed(1),
            });
          }

          if (onScaleUpdate) {
            onScaleUpdate(currentScale.toFixed(2));
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      aGeometry.dispose();
      glassMaterial.dispose();
      edgesGeometry.dispose();
      edgesMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [onQuaternionUpdate]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
}
