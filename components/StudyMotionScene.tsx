"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const assetPaths = [
  "/3d_floating_books.png",
  "/3d_grad_cap.png",
  "/3d_floating_pen.png",
  "/3d_rocket_launch.png",
  "/3d_book_icon_stage.png",
];

export default function StudyMotionScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.15, 8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const orbit = new THREE.Group();
    scene.add(orbit);

    const loader = new THREE.TextureLoader();
    const cards: THREE.Mesh[] = [];
    const layout = [
      { x: -2.7, y: 0.75, z: -0.8, size: 1.8, spin: 0.18 },
      { x: 2.35, y: 0.95, z: -1.2, size: 1.55, spin: -0.15 },
      { x: -2.05, y: -1.45, z: 0.15, size: 1.45, spin: -0.2 },
      { x: 2.05, y: -1.2, z: 0.1, size: 1.65, spin: 0.22 },
      { x: 0.1, y: -0.05, z: 0.7, size: 2.15, spin: 0.12 },
    ];

    assetPaths.forEach((path, index) => {
      const texture = loader.load(path);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      const geometry = new THREE.PlaneGeometry(layout[index].size, layout[index].size);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(layout[index].x, layout[index].y, layout[index].z);
      mesh.rotation.set(0.12, layout[index].spin, -layout[index].spin * 0.8);
      mesh.userData = { baseY: layout[index].y, baseX: layout[index].x, phase: index * 0.85 };
      orbit.add(mesh);
      cards.push(mesh);
    });

    const ringGeometry = new THREE.TorusGeometry(2.7, 0.012, 12, 140);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.32,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.set(1.18, 0.05, -0.25);
    orbit.add(ring);

    const dotGeometry = new THREE.BufferGeometry();
    const dots = 140;
    const positions = new Float32Array(dots * 3);
    for (let i = 0; i < dots; i++) {
      const radius = 3.2 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 2;
    }
    dotGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dotMaterial = new THREE.PointsMaterial({
      color: 0xfde68a,
      size: 0.035,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const particleField = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(particleField);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 640 ? 9.1 : 7.2;
      camera.updateProjectionMatrix();
    };

    host.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", resize);
    resize();

    let frame = 0;
    let raf = 0;
    const animate = () => {
      frame += reduceMotion ? 0.004 : 0.014;
      orbit.rotation.y += (pointer.x * 0.16 - orbit.rotation.y) * 0.035;
      orbit.rotation.x += (-pointer.y * 0.09 - orbit.rotation.x) * 0.035;
      particleField.rotation.y = frame * 0.22;
      ring.rotation.z = frame * 0.35;

      cards.forEach((mesh, index) => {
        const phase = mesh.userData.phase as number;
        mesh.position.y = (mesh.userData.baseY as number) + Math.sin(frame * 2 + phase) * 0.16;
        mesh.position.x = (mesh.userData.baseX as number) + Math.cos(frame * 1.2 + phase) * 0.08;
        mesh.rotation.z += (index % 2 === 0 ? 0.002 : -0.002) * (reduceMotion ? 0.2 : 1);
      });

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      cards.forEach((mesh) => {
        mesh.geometry.dispose();
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.map?.dispose();
        material.dispose();
      });
      ringGeometry.dispose();
      ringMaterial.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />;
}
