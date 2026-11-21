import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface Vehicle3DStageProps {
  category: 'motorcycle' | 'car';
  powertrain?: 'combustion' | 'hybrid' | 'electric';
  accentHex: string;
  headlightOn: boolean;
  isAnimating: boolean;
}

// ============================================================================
// BUILD PROCEDURAL 3D MOTORCYCLE (YAMAHA FAZER FZ 25 2026 STREETFIGHTER)
// ============================================================================
function buildMotorcycle3D(accentHex: string, isElectric: boolean) {
  const root = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  const headlightMeshes: THREE.Object3D[] = [];
  let headlightSpot: THREE.SpotLight | null = null;

  // PBR Materials
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(accentHex),
    metalness: 0.62,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });

  const matteBlackMat = new THREE.MeshStandardMaterial({
    color: 0x16161a,
    metalness: 0.25,
    roughness: 0.65
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x26262c,
    metalness: 0.78,
    roughness: 0.32
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dce3,
    metalness: 0.95,
    roughness: 0.12
  });

  const goldForkMat = new THREE.MeshStandardMaterial({
    color: 0xd99b26,
    metalness: 0.88,
    roughness: 0.22
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111114,
    metalness: 0.08,
    roughness: 0.88
  });

  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c20,
    metalness: 0.05,
    roughness: 0.85
  });

  const ledWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xbae6fd),
    emissiveIntensity: 3.2,
    roughness: 0.1
  });

  const ledRedMat = new THREE.MeshStandardMaterial({
    color: 0xff2a2a,
    emissive: new THREE.Color(0xef4444),
    emissiveIntensity: 2.5,
    roughness: 0.15
  });

  const electricGlowMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: new THREE.Color(0x22d3ee),
    emissiveIntensity: 1.8,
    roughness: 0.2
  });

  // Helper: Build detailed wheel (tire + 10-spoke alloy rim + ABS disc + caliper)
  const createWheel = (radius: number, tube: number, isFront: boolean) => {
    const wheelHolder = new THREE.Group();
    const spinGroup = new THREE.Group();

    // Radial Tire
    const tire = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 20, 48), tireMat);
    tire.castShadow = true;
    tire.receiveShadow = true;
    spinGroup.add(tire);

    // Outer Alloy Rim Ring
    const rimRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius - tube * 0.72, 0.022, 12, 36),
      darkMetalMat
    );
    spinGroup.add(rimRing);

    // Accent Rim Pinstripe
    const stripeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      emissive: new THREE.Color(accentHex),
      emissiveIntensity: 0.4,
      roughness: 0.3
    });
    [-tube * 0.52, tube * 0.52].forEach(zPos => {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(radius - tube * 0.68, 0.007, 8, 36), stripeMat);
      stripe.position.z = zPos;
      spinGroup.add(stripe);
    });

    // Central Hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, tube * 1.4, 20), darkMetalMat);
    hub.rotation.x = Math.PI / 2;
    spinGroup.add(hub);

    // 5 Pairs of Y-Split Spokes (10 spokes total)
    const spokeLen = radius - tube * 0.72 - 0.04;
    for (let i = 0; i < 5; i++) {
      const baseAngle = (i * Math.PI * 2) / 5;
      [-0.14, 0.14].forEach(offset => {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.022, spokeLen, 0.026), darkMetalMat);
        const a = baseAngle + offset;
        spoke.position.set(Math.cos(a) * (spokeLen * 0.5 + 0.03), Math.sin(a) * (spokeLen * 0.5 + 0.03), 0);
        spoke.rotation.z = a - Math.PI / 2;
        spinGroup.add(spoke);
      });
    }

    // Stainless Brake Disc (282mm front / 220mm rear)
    const discRadius = isFront ? radius * 0.62 : radius * 0.5;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(discRadius, discRadius, 0.014, 32), chromeMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.z = isFront ? tube * 0.85 : -tube * 0.82;
    spinGroup.add(disc);

    // Gold ABS Sensor Ring
    const absRing = new THREE.Mesh(new THREE.TorusGeometry(discRadius * 0.52, 0.008, 8, 28), goldForkMat);
    absRing.position.z = isFront ? tube * 0.94 : -tube * 0.91;
    spinGroup.add(absRing);

    wheelHolder.add(spinGroup);
    wheels.push(spinGroup);

    // Stationary Brake Caliper (does not spin)
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.055), goldForkMat);
    caliper.position.set(isFront ? -discRadius * 0.78 : discRadius * 0.7, 0.05, isFront ? tube * 0.86 : -tube * 0.83);
    wheelHolder.add(caliper);

    return wheelHolder;
  };

  // Wheels positioned on ground y = 0 (radius + tube = 0.37)
  const rearWheel = createWheel(0.285, 0.095, false);
  rearWheel.position.set(-0.74, 0.38, 0);
  root.add(rearWheel);

  const frontWheel = createWheel(0.29, 0.082, true);
  frontWheel.position.set(0.76, 0.372, 0);
  root.add(frontWheel);

  // Rear Swingarm (Dual boxed arms)
  [-0.125, 0.125].forEach(zSide => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.068, 0.036), darkMetalMat);
    arm.position.set(-0.44, 0.41, zSide);
    arm.rotation.z = -0.09;
    arm.castShadow = true;
    root.add(arm);
  });

  // Yellow Monocross Central Rear Shock Absorber
  const shockRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 12), chromeMat);
  shockRod.position.set(-0.27, 0.57, 0);
  shockRod.rotation.z = -0.45;
  root.add(shockRod);

  const shockSpringMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.4, roughness: 0.35 });
  for (let i = 0; i < 6; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.009, 8, 16), shockSpringMat);
    coil.position.set(-0.33 + i * 0.024, 0.49 + i * 0.032, 0);
    coil.rotation.x = Math.PI / 2;
    coil.rotation.y = 0.45;
    root.add(coil);
  }

  // Diamond Frame Main Tubes
  [-0.09, 0.09].forEach(zSide => {
    const frameTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.82, 12), darkMetalMat);
    frameTube.position.set(0.08, 0.72, zSide);
    frameTube.rotation.z = -1.1;
    root.add(frameTube);
  });

  // Engine / Electric Powertrain Core
  if (isElectric) {
    // Sleek Electric Battery Pack with Cyan LED Strips
    const batteryBox = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.24), matteBlackMat);
    batteryBox.position.set(0.02, 0.54, 0);
    batteryBox.castShadow = true;
    root.add(batteryBox);

    [-0.125, 0.125].forEach(zSide => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.015), electricGlowMat);
      strip.position.set(0.02, 0.56, zSide);
      root.add(strip);
    });
  } else {
    // 250cc BlueFlex Engine Block + Cooling Fins + Crankcase
    const crankcase = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.26, 20), matteBlackMat);
    crankcase.rotation.x = Math.PI / 2;
    crankcase.position.set(-0.02, 0.44, 0);
    crankcase.castShadow = true;
    root.add(crankcase);

    // Clutch / Stator Side Covers
    [-0.135, 0.135].forEach(zSide => {
      const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), darkMetalMat);
      cover.rotation.x = Math.PI / 2;
      cover.position.set(-0.02, 0.44, zSide);
      root.add(cover);
    });

    // Tilted Engine Cylinder with Stacked Cooling Fins
    const cylinder = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.28, 0.19), matteBlackMat);
    cylinder.position.set(0.09, 0.62, 0);
    cylinder.rotation.z = -0.22;
    cylinder.castShadow = true;
    root.add(cylinder);

    for (let i = 0; i < 6; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.22), darkMetalMat);
      fin.position.set(0.075 + i * 0.008, 0.53 + i * 0.036, 0);
      fin.rotation.z = -0.22;
      root.add(fin);
    }

    // Swept Chrome Exhaust Header + Stubby Mid-Ship Muffler (Right side +z)
    const exhaustCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.19, 0.62, 0.05),
      new THREE.Vector3(0.26, 0.42, 0.11),
      new THREE.Vector3(0.06, 0.28, 0.14),
      new THREE.Vector3(-0.22, 0.31, 0.16)
    ]);
    const headerPipe = new THREE.Mesh(new THREE.TubeGeometry(exhaustCurve, 24, 0.025, 10, false), chromeMat);
    headerPipe.castShadow = true;
    root.add(headerPipe);

    const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.46, 14), matteBlackMat);
    muffler.position.set(-0.44, 0.38, 0.185);
    muffler.rotation.z = 1.24;
    muffler.castShadow = true;
    root.add(muffler);

    const mufflerTip = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, 0.06, 14), chromeMat);
    mufflerTip.position.set(-0.65, 0.455, 0.185);
    mufflerTip.rotation.z = 1.24;
    root.add(mufflerTip);

    // Belly Pan Spoiler (Under Engine)
    const bellyPan = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.2), matteBlackMat);
    bellyPan.position.set(0.06, 0.29, 0);
    bellyPan.rotation.z = 0.08;
    root.add(bellyPan);
  }

  // Sculpted Muscular 14.2L Fuel Tank (Extruded Curved Profile with Bevel)
  const tankShape = new THREE.Shape();
  tankShape.moveTo(-0.24, 0.0);
  tankShape.quadraticCurveTo(-0.08, 0.24, 0.18, 0.23);
  tankShape.quadraticCurveTo(0.36, 0.2, 0.42, 0.04);
  tankShape.lineTo(0.28, -0.08);
  tankShape.lineTo(-0.18, -0.05);
  tankShape.closePath();

  const tankGeo = new THREE.ExtrudeGeometry(tankShape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.045,
    bevelSegments: 5
  });
  tankGeo.center();
  const tank = new THREE.Mesh(tankGeo, paintMat);
  tank.position.set(0.11, 0.89, 0);
  tank.castShadow = true;
  tank.receiveShadow = true;
  root.add(tank);

  // Aggressive Side Air-Intake Shrouds (FZ25 2026 signature muscular intakes)
  const shroudShape = new THREE.Shape();
  shroudShape.moveTo(0, 0);
  shroudShape.lineTo(0.32, 0.08);
  shroudShape.lineTo(0.38, -0.14);
  shroudShape.lineTo(0.12, -0.2);
  shroudShape.closePath();

  const shroudGeo = new THREE.ExtrudeGeometry(shroudShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3
  });
  [-0.185, 0.16].forEach((zPos, idx) => {
    const shroud = new THREE.Mesh(shroudGeo, paintMat);
    shroud.position.set(0.12, 0.82, zPos);
    shroud.rotation.y = idx === 0 ? 0.18 : -0.18;
    shroud.castShadow = true;
    root.add(shroud);

    // Matte black intake louver inside shroud
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.02), matteBlackMat);
    intake.position.set(0.28, 0.74, zPos + (idx === 0 ? -0.01 : 0.035));
    intake.rotation.y = idx === 0 ? 0.18 : -0.18;
    root.add(intake);
  });

  // Chrome CNC Fuel Cap on Top of Tank
  const fuelCap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 18), chromeMat);
  fuelCap.position.set(0.18, 1.045, 0);
  fuelCap.rotation.z = -0.15;
  root.add(fuelCap);

  // Split Two-Level Ergonomic Seat (Rider + Pillion)
  const riderSeat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.085, 0.25), seatMat);
  riderSeat.position.set(-0.26, 0.77, 0);
  riderSeat.rotation.z = 0.06;
  riderSeat.castShadow = true;
  root.add(riderSeat);

  const pillionSeat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.085, 0.21), seatMat);
  pillionSeat.position.set(-0.62, 0.89, 0);
  pillionSeat.rotation.z = -0.22;
  pillionSeat.castShadow = true;
  root.add(pillionSeat);

  // Sharp Upswept Tail Cowl + Glowing Red LED Taillight + Rear Plate Holder
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(-0.48, 0.2);
  tailShape.lineTo(-0.54, 0.14);
  tailShape.lineTo(-0.14, -0.07);
  tailShape.closePath();

  const tailGeo = new THREE.ExtrudeGeometry(tailShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3
  });
  tailGeo.center();
  const tailCowl = new THREE.Mesh(tailGeo, paintMat);
  tailCowl.position.set(-0.58, 0.82, 0);
  tailCowl.castShadow = true;
  root.add(tailCowl);

  const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.032, 0.13), ledRedMat);
  taillight.position.set(-0.85, 0.9, 0);
  root.add(taillight);

  const plateArm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.05), matteBlackMat);
  plateArm.position.set(-0.89, 0.76, 0);
  plateArm.rotation.z = 0.45;
  root.add(plateArm);

  // Signature Gold Front Telescopic Forks (Yamaha FZ25 Gold Tubes)
  [-0.095, 0.095].forEach(zSide => {
    const outerFork = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.025, 0.46, 14), goldForkMat);
    outerFork.position.set(0.55, 0.84, zSide);
    outerFork.rotation.z = 0.42;
    outerFork.castShadow = true;
    root.add(outerFork);

    const innerFork = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.42, 14), chromeMat);
    innerFork.position.set(0.68, 0.54, zSide);
    innerFork.rotation.z = 0.42;
    root.add(innerFork);
  });

  // Sculpted Front Fender (Painted)
  const fender = new THREE.Mesh(
    new THREE.CylinderGeometry(0.39, 0.39, 0.14, 20, 1, true, -0.7, 1.3),
    paintMat
  );
  fender.rotation.z = Math.PI / 2;
  fender.rotation.x = Math.PI / 2;
  fender.position.set(0.76, 0.38, 0);
  root.add(fender);

  // Streetfighter Handlebars + Grips + Angular Mirrors + Blackout Digital Dashboard
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.68, 12), chromeMat);
  handlebar.rotation.x = Math.PI / 2;
  handlebar.position.set(0.43, 1.07, 0);
  root.add(handlebar);

  [-0.29, 0.29].forEach(zSide => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.13, 12), matteBlackMat);
    grip.rotation.x = Math.PI / 2;
    grip.position.set(0.43, 1.07, zSide);
    root.add(grip);

    // Mirror Stem + Angular Mirror Head
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 8), matteBlackMat);
    stem.position.set(0.43, 1.15, zSide * 0.85);
    stem.rotation.x = zSide > 0 ? 0.35 : -0.35;
    root.add(stem);

    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.065, 0.11), matteBlackMat);
    mirror.position.set(0.43, 1.23, zSide * 1.05);
    root.add(mirror);
  });

  // Blackout LCD Digital Y-Connect Cluster
  const cluster = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.14), matteBlackMat);
  cluster.position.set(0.51, 1.07, 0);
  cluster.rotation.z = -0.45;
  root.add(cluster);

  const lcdScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.11, 0.045),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  lcdScreen.position.set(0.49, 1.092, 0);
  lcdScreen.rotation.y = -Math.PI / 2;
  lcdScreen.rotation.x = -0.45;
  root.add(lcdScreen);

  // Aggressive Bi-Functional LED Projector Headlight Mask & Volumetric Beam
  const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.22, 0.2), paintMat);
  cowl.position.set(0.58, 0.91, 0);
  cowl.rotation.z = -0.22;
  cowl.castShadow = true;
  root.add(cowl);

  const projectorLens = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), ledWhiteMat);
  projectorLens.position.set(0.675, 0.9, 0);
  projectorLens.scale.set(0.55, 1.0, 1.15);
  root.add(projectorLens);
  headlightMeshes.push(projectorLens);

  // Dual Sharp LED DRL Eyebrows
  [-0.065, 0.065].forEach(zSide => {
    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.022, 0.06), ledWhiteMat);
    drl.position.set(0.67, 0.965, zSide);
    drl.rotation.x = zSide > 0 ? -0.3 : 0.3;
    root.add(drl);
    headlightMeshes.push(drl);
  });

  // Volumetric Translucent Headlight Light Cone
  const beamGeo = new THREE.ConeGeometry(0.52, 2.2, 24, 1, true);
  beamGeo.translate(0, -1.1, 0);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const beamCone = new THREE.Mesh(beamGeo, beamMat);
  beamCone.position.set(0.69, 0.9, 0);
  beamCone.rotation.z = Math.PI / 2 + 0.18;
  root.add(beamCone);
  headlightMeshes.push(beamCone);

  // Real Three.js SpotLight projected onto the showroom floor
  headlightSpot = new THREE.SpotLight(0xdbeafe, 6, 6, Math.PI / 5, 0.65, 1.5);
  headlightSpot.position.set(0.7, 0.9, 0);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(2.4, 0.0, 0);
  root.add(spotTarget);
  headlightSpot.target = spotTarget;
  root.add(headlightSpot);

  return { root, wheels, headlightMeshes, headlightSpot };
}

// ============================================================================
// BUILD PROCEDURAL 3D SPORT CAR / ELECTRIC SEDAN 2026
// ============================================================================
function buildCar3D(accentHex: string, isElectric: boolean) {
  const root = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  const headlightMeshes: THREE.Object3D[] = [];
  let headlightSpot: THREE.SpotLight | null = null;

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(accentHex),
    metalness: 0.68,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b101b,
    metalness: 0.9,
    roughness: 0.05,
    clearcoat: 1.0
  });

  const matteBlackMat = new THREE.MeshStandardMaterial({
    color: 0x151519,
    metalness: 0.25,
    roughness: 0.7
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.9,
    roughness: 0.18
  });

  const caliperMat = new THREE.MeshStandardMaterial({
    color: isElectric ? 0x06b6d4 : 0xef4444,
    metalness: 0.6,
    roughness: 0.3
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x101013,
    metalness: 0.08,
    roughness: 0.88
  });

  const ledWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xbae6fd),
    emissiveIntensity: 3.2,
    roughness: 0.1
  });

  const ledRedMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: new THREE.Color(0xef4444),
    emissiveIntensity: 2.6,
    roughness: 0.15
  });

  // Sculpted Aerodynamic Lower Car Body (Extruded Side Silhouette with Bevel)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-1.18, 0.14);
  bodyShape.lineTo(1.2, 0.14);
  bodyShape.quadraticCurveTo(1.27, 0.24, 1.21, 0.43); // front bumper & nose
  bodyShape.quadraticCurveTo(0.86, 0.54, 0.56, 0.56); // sculpted hood
  bodyShape.lineTo(0.24, 0.86); // windshield base -> roof
  bodyShape.quadraticCurveTo(-0.18, 0.92, -0.66, 0.82); // fastback roofline
  bodyShape.lineTo(-1.05, 0.58); // rear decklid
  bodyShape.lineTo(-1.2, 0.55); // rear lip spoiler
  bodyShape.quadraticCurveTo(-1.25, 0.34, -1.18, 0.14);
  bodyShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.92,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.06,
    bevelSegments: 5
  });
  bodyGeo.center();
  const carBody = new THREE.Mesh(bodyGeo, paintMat);
  carBody.position.set(0, 0.56, 0);
  carBody.castShadow = true;
  carBody.receiveShadow = true;
  root.add(carBody);

  // Dark Panoramic Glass Cabin Overlay
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.88, 0.0);
  cabinShape.lineTo(0.46, 0.0);
  cabinShape.lineTo(0.18, 0.29);
  cabinShape.quadraticCurveTo(-0.2, 0.34, -0.58, 0.25);
  cabinShape.closePath();

  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 0.78,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.03,
    bevelSegments: 4
  });
  cabinGeo.center();
  const cabinGlass = new THREE.Mesh(cabinGeo, glassMat);
  cabinGlass.position.set(-0.12, 0.78, 0);
  root.add(cabinGlass);

  // Side Skirts, Front Splitter & Rear Diffuser
  const underbody = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.09, 1.06), matteBlackMat);
  underbody.position.set(0, 0.2, 0);
  underbody.castShadow = true;
  root.add(underbody);

  // EV Cyan Side Battery Accent Line
  if (isElectric) {
    const evAccentMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: new THREE.Color(0x06b6d4),
      emissiveIntensity: 1.8
    });
    [-0.545, 0.545].forEach(zSide => {
      const evLine = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.022, 0.02), evAccentMat);
      evLine.position.set(0, 0.21, zSide);
      root.add(evLine);
    });
  }

  // Front Grille (Sport Black Mesh or Sleek EV Lightbar)
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.64), matteBlackMat);
  grille.position.set(1.27, 0.36, 0);
  root.add(grille);

  if (isElectric) {
    const evBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.88), ledWhiteMat);
    evBar.position.set(1.28, 0.49, 0);
    root.add(evBar);
    headlightMeshes.push(evBar);
  }

  // Dual Sharp LED Headlights + Volumetric Cones
  [-0.38, 0.38].forEach(zSide => {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.065, 0.22), ledWhiteMat);
    lamp.position.set(1.24, 0.49, zSide);
    lamp.rotation.y = zSide > 0 ? -0.22 : 0.22;
    root.add(lamp);
    headlightMeshes.push(lamp);

    const coneGeo = new THREE.ConeGeometry(0.36, 1.9, 20, 1, true);
    coneGeo.translate(0, -0.95, 0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(1.27, 0.48, zSide);
    cone.rotation.z = Math.PI / 2 + 0.14;
    root.add(cone);
    headlightMeshes.push(cone);
  });

  // Full-Width Glowing Red LED Taillight Bar
  const rearLightBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, 0.94), ledRedMat);
  rearLightBar.position.set(-1.26, 0.54, 0);
  root.add(rearLightBar);

  // Side Mirrors
  [-0.56, 0.56].forEach(zSide => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.12), paintMat);
    mirror.position.set(0.38, 0.72, zSide);
    root.add(mirror);
  });

  // 4 Spinning Diamond-Cut Alloy Wheels
  const wheelCoords: [number, number, number][] = [
    [0.74, 0.265, 0.53],
    [0.74, 0.265, -0.53],
    [-0.74, 0.265, 0.53],
    [-0.74, 0.265, -0.53]
  ];

  wheelCoords.forEach(([wx, wy, wz]) => {
    const wheelHolder = new THREE.Group();
    const spinGroup = new THREE.Group();

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.265, 0.17, 32), tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.castShadow = true;
    spinGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.178, 24), matteBlackMat);
    rim.rotation.x = Math.PI / 2;
    spinGroup.add(rim);

    // 5 Diamond-Cut Spokes
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.34, 0.184), rimMat);
      spoke.rotation.z = a;
      spinGroup.add(spoke);
    }

    const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.19, 16), caliperMat);
    centerCap.rotation.x = Math.PI / 2;
    spinGroup.add(centerCap);

    wheelHolder.position.set(wx, wy, wz);
    wheelHolder.add(spinGroup);
    wheels.push(spinGroup);

    // Brake Caliper
    const cal = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.04), caliperMat);
    cal.position.set(-0.08, 0.03, wz > 0 ? 0.05 : -0.05);
    wheelHolder.add(cal);

    root.add(wheelHolder);
  });

  // Real Headlight SpotLight
  headlightSpot = new THREE.SpotLight(0xdbeafe, 6, 6.5, Math.PI / 4, 0.65, 1.5);
  headlightSpot.position.set(1.28, 0.5, 0);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(3.2, 0.0, 0);
  root.add(spotTarget);
  headlightSpot.target = spotTarget;
  root.add(headlightSpot);

  return { root, wheels, headlightMeshes, headlightSpot };
}

// ============================================================================
// REACT THREE.JS WEBGL 3D STUDIO COMPONENT
// ============================================================================
const Vehicle3DStage: React.FC<Vehicle3DStageProps> = ({
  category,
  powertrain = 'combustion',
  accentHex,
  headlightOn,
  isAnimating
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headlightOnRef = useRef(headlightOn);
  const isAnimatingRef = useRef(isAnimating);

  useEffect(() => {
    headlightOnRef.current = headlightOn;
  }, [headlightOn]);

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 240;

    // Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0d);
    scene.fog = new THREE.FogExp2(0x0a0a0d, 0.14);

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 30);

    // WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Realistic Studio Environment Map (Softbox Reflections on Metallic Paint!)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Studio 3-Point Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(2.5, 4.5, 3.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(new THREE.Color(accentHex), 1.8);
    rimLight.position.set(-3.2, 2.2, -2.8);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x93c5fd, 1.4, 10);
    fillLight.position.set(2.0, 1.4, -2.5);
    scene.add(fillLight);

    // Reflective Obsidian Turntable Floor + Neon Accent Ring
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e12,
      metalness: 0.55,
      roughness: 0.28
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const pedestalRadius = category === 'car' ? 1.72 : 1.38;
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(pedestalRadius, pedestalRadius + 0.08, 0.04, 48),
      new THREE.MeshStandardMaterial({ color: 0x15151a, metalness: 0.7, roughness: 0.25 })
    );
    pedestal.position.y = 0.02;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const neonRingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      emissive: new THREE.Color(accentHex),
      emissiveIntensity: 2.2,
      roughness: 0.2
    });
    const neonRing = new THREE.Mesh(new THREE.TorusGeometry(pedestalRadius, 0.015, 12, 64), neonRingMat);
    neonRing.rotation.x = Math.PI / 2;
    neonRing.position.y = 0.045;
    scene.add(neonRing);

    const outerGlowRing = new THREE.Mesh(
      new THREE.TorusGeometry(pedestalRadius + 0.22, 0.006, 8, 64),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(accentHex), transparent: true, opacity: 0.3 })
    );
    outerGlowRing.rotation.x = Math.PI / 2;
    outerGlowRing.position.y = 0.025;
    scene.add(outerGlowRing);

    // Build Vehicle Model
    const isElectric = powertrain === 'electric';
    const built =
      category === 'car'
        ? buildCar3D(accentHex, isElectric)
        : buildMotorcycle3D(accentHex, isElectric);

    built.root.position.y = 0.04;
    scene.add(built.root);

    // Orbit Camera Control State (Mouse & Touch Drag + Auto Showcase Orbit)
    const camDistance = category === 'car' ? 3.55 : 2.95;
    const targetY = category === 'car' ? 0.56 : 0.68;
    let theta = 0.62; // horizontal orbit angle
    let phi = 0.28; // vertical elevation angle
    let targetTheta = theta;
    let targetPhi = phi;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetTheta -= dx * 0.01;
      targetPhi = Math.max(0.08, Math.min(0.85, targetPhi + dy * 0.007));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.style.touchAction = 'none';
    domEl.style.cursor = 'grab';
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth || 340;
      const h = container.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 60 FPS Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      if (isAnimatingRef.current) {
        // Spin wheels continuously
        built.wheels.forEach(w => {
          w.rotation.z -= dt * 3.8;
        });

        // Subtle suspension breathing
        built.root.position.y = 0.04 + Math.sin(elapsed * 2.4) * 0.008;

        // Smooth orbital camera rotation when user is not dragging
        if (!isDragging) {
          targetTheta += dt * 0.42;
        }
      }

      // Smooth damped orbit interpolation
      theta += (targetTheta - theta) * 0.1;
      phi += (targetPhi - phi) * 0.1;

      camera.position.set(
        Math.cos(theta) * Math.cos(phi) * camDistance,
        targetY + Math.sin(phi) * camDistance,
        Math.sin(theta) * Math.cos(phi) * camDistance
      );
      camera.lookAt(0, targetY, 0);

      // Update Headlight visibility dynamically
      const hOn = headlightOnRef.current;
      built.headlightMeshes.forEach(m => {
        m.visible = hOn;
      });
      if (built.headlightSpot) {
        built.headlightSpot.intensity = hOn ? 6.0 : 0;
      }

      // Subtle neon ring pulse
      neonRingMat.emissiveIntensity = 1.9 + Math.sin(elapsed * 2.6) * 0.4;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      scene.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      envRT.dispose();
      renderer.dispose();
    };
  }, [category, powertrain, accentHex]);

  return (
    <div className="relative w-full h-[235px] sm:h-[320px] rounded-2xl overflow-hidden bg-[#0a0a0d] border border-white/5 select-none">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-2.5 left-3 pointer-events-none">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-300 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          WebGL 3D • Arraste para girar
        </span>
      </div>
    </div>
  );
};

export default React.memo(Vehicle3DStage);
