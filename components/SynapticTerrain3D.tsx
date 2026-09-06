// Synaptic Terrain 3D: the weight matrix as a living landscape.
// 576 instanced bars; height & color track synapse weight, green flash
// marks just-written synapses. Smooth lerp = traces visibly grow/decay.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { MATRIX_SIZE, type Matrix } from "@/lib/engine";

type Props = {
  matrix: Matrix;
  newSpikes: number[] | null;
  height: number;
};

const BAR_SPACING = 1.05;
const GRID_W = MATRIX_SIZE * BAR_SPACING;
const MAX_BAR_H = 6;
const MAX_BAR_R = 0.42;

const COL_SILENT = new THREE.Color("#0d1424");
const COL_WEAK = new THREE.Color("#38bdf8");
const COL_STRONG = new THREE.Color("#fb923c");
const COL_FLASH = new THREE.Color("#34d399");

const tmpObj = new THREE.Object3D();
const tmpCol = new THREE.Color();

/** One instance per synapse; per-frame lerp toward its target weight. */
function TerrainBars({ matrix, newSpikes }: { matrix: Matrix; newSpikes: number[] | null }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const heights = useRef<Float32Array>(new Float32Array(MATRIX_SIZE * MATRIX_SIZE));
  const flash = useRef<Float32Array>(new Float32Array(MATRIX_SIZE * MATRIX_SIZE));

  // bump flash energy on the cells written by the latest token
  useEffect(() => {
    if (!newSpikes) return;
    for (const i of newSpikes) {
      for (const j of newSpikes) {
        flash.current[i * MATRIX_SIZE + j] = 1;
      }
    }
  }, [newSpikes]);

  useFrame((_, rawDelta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const delta = Math.min(rawDelta, 0.05); // tab-switch safety
    const decayK = Math.exp(-6 * delta); // ~0.17s flash half-life
    const follow = 1 - Math.exp(-14 * delta); // bar height easing

    for (let i = 0; i < MATRIX_SIZE; i++) {
      for (let j = 0; j < MATRIX_SIZE; j++) {
        const idx = i * MATRIX_SIZE + j;
        const target = matrix[i][j];
        heights.current[idx] += (target - heights.current[idx]) * follow;
        if (flash.current[idx] > 0.001) flash.current[idx] *= decayK;
        else flash.current[idx] = 0;

        const h = heights.current[idx];
        const x = (j - (MATRIX_SIZE - 1) / 2) * BAR_SPACING;
        const z = (i - (MATRIX_SIZE - 1) / 2) * BAR_SPACING;

        tmpObj.position.set(x, (h * MAX_BAR_H) / 2, z);
        tmpObj.scale.set(1, Math.max(h * MAX_BAR_H, 0.02), 1);
        tmpObj.updateMatrix();
        mesh.setMatrixAt(idx, tmpObj.matrix);

        // silent → weak → strong, flash overrides toward green
        const t = Math.min(h, 1);
        if (t < 0.5) {
          tmpCol.copy(COL_SILENT).lerp(COL_WEAK, t / 0.5);
        } else {
          tmpCol.copy(COL_WEAK).lerp(COL_STRONG, (t - 0.5) / 0.5);
        }
        const f = flash.current[idx];
        if (f > 0.001) tmpCol.lerp(COL_FLASH, f * 0.9);
        mesh.setColorAt(idx, tmpCol);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MATRIX_SIZE * MATRIX_SIZE]}>
      <boxGeometry args={[MAX_BAR_R, 1, MAX_BAR_R]} />
      <meshStandardMaterial roughness={0.35} metalness={0.15} />
    </instancedMesh>
  );
}

function Baseplate() {
  return (
    <group position={[0, -0.02, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GRID_W + 1.4, GRID_W + 1.4]} />
        <meshStandardMaterial color="#0b1120" roughness={0.9} metalness={0.05} />
      </mesh>
      <gridHelper args={[GRID_W + 1.4, MATRIX_SIZE, "#1e2a44", "#141d33"]} />
    </group>
  );
}

function CameraRig({ autoRotate }: { autoRotate: boolean }) {
  return (
    <OrbitControls
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={1.2}
      enablePan={false}
      minDistance={10}
      maxDistance={42}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2.15}
      target={[0, 1, 0]}
    />
  );
}

export default function SynapticTerrain3D({ matrix, newSpikes, height }: Props) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [ready, setReady] = useState(false);

  const written = useMemo(() => {
    let n = 0;
    for (const row of matrix) for (const w of row) if (w > 0.01) n++;
    return n;
  }, [matrix]);

  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
            Synaptic Terrain — 3D
          </h3>
          <p className="text-[11px] text-muted mt-0.5">
            {written} / {MATRIX_SIZE * MATRIX_SIZE} synapses holding a trace · drag to orbit,
            scroll to zoom
          </p>
        </div>
        <button
          onClick={() => setAutoRotate((v) => !v)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            autoRotate
              ? "border-accent/50 bg-accent/15 text-accent-strong"
              : "border-edge text-muted hover:text-foreground"
          }`}
          aria-pressed={autoRotate}
        >
          {autoRotate ? "◉ Auto-orbit on" : "○ Auto-orbit off"}
        </button>
      </div>

      <div
        className="relative rounded-lg overflow-hidden bg-[#070b14]"
        style={{ height }}
      >
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
            loading 3D terrain…
          </div>
        )}
        <Canvas
          camera={{ position: [16, 14, 16], fov: 42 }}
          dpr={[1, 2]}
          onCreated={() => setReady(true)}
          frameloop="always"
        >
          <color attach="background" args={["#070b14"]} />
          <fog attach="fog" args={["#070b14", 34, 62]} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[10, 18, 8]} intensity={1.1} />
          <directionalLight position={[-8, 10, -12]} intensity={0.35} color="#7dd3fc" />
          <TerrainBars matrix={matrix} newSpikes={newSpikes} />
          <Baseplate />
          <CameraRig autoRotate={autoRotate} />
        </Canvas>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#164e63" }} />
          silent
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#38bdf8" }} />
          weak trace
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#fb923c" }} />
          strong trace
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#34d399" }} />
          just written
        </span>
      </div>
    </div>
  );
}
