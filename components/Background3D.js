"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Background3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 24;

    // 2. WebGL Renderer with High-End Monochrome Tone
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // 3. Floating 3D Wireframe Polyhedrons (Dodecahedron & Icosahedron)
    const geometry1 = new THREE.IcosahedronGeometry(4.5, 1);
    const material1 = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      roughness: 0.2,
      metalness: 0.9,
    });
    const mesh1 = new THREE.Mesh(geometry1, material1);
    mesh1.position.set(-10, 4, -4);
    scene.add(mesh1);

    const geometry2 = new THREE.DodecahedronGeometry(3.5, 0);
    const material2 = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
      roughness: 0.1,
      metalness: 1.0,
    });
    const mesh2 = new THREE.Mesh(geometry2, material2);
    mesh2.position.set(12, -5, -6);
    scene.add(mesh2);

    // 4. Subtle Wireframe Infinite Floor Grid
    const gridHelper = new THREE.GridHelper(80, 50, 0x3f3f46, 0x18181b);
    gridHelper.position.y = -12;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.2;
    scene.add(gridHelper);

    // 5. Starfield / Ambient Floating Dust
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60;
      positions[i + 1] = (Math.random() - 0.5) * 40;
      positions[i + 2] = (Math.random() - 0.5) * 40;
    }
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.25,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 6. Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 20, 100);
    pointLight.position.set(0, 10, 15);
    scene.add(pointLight);

    // 7. Mouse Parallax Responsiveness
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 8. Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // 9. Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      targetX = mouseX * 2.5;
      targetY = mouseY * 1.8;
      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Rotate polyhedrons
      mesh1.rotation.x = elapsedTime * 0.15;
      mesh1.rotation.y = elapsedTime * 0.2;
      mesh2.rotation.x = -elapsedTime * 0.12;
      mesh2.rotation.z = elapsedTime * 0.18;

      // Gentle wave on grid
      gridHelper.position.z = (elapsedTime * 0.5) % 2;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry1.dispose();
      material1.dispose();
      geometry2.dispose();
      material2.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
    />
  );
}
