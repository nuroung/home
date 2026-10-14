import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { animate, motion, useAnimationControls, useMotionValue, useTransform } from 'motion/react'
import type { TargetAndTransition } from 'motion/react'
import { ORBITS, type OrbitId } from '../data/anchors'
import { worldAt } from '../data/worlds'
import { CAMERA } from '../motion/camera'
import {
  DOT_HOVER_ORBIT,
  LABEL_FADE,
  RING_HOVER,
  RING_SCALE,
  TAP_KEYFRAMES_ORBIT,
  TAP_POP,
} from '../motion/interaction'
import { A_TO_B, B_TO_A, tr, type Cue } from '../motion/transition'
import { useScene, type Step } from './scene'

// 궤도 화면: 원 4개(A 의 원들이 B 의 궤도로 바뀐다), 부유하는 배, 조각난 세계.
// A↔B 전환은 Motion(아래 a/b 상태 + transition.ts 의 타이밍), 공전은 CSS keyframes.
//
// 렌더링 비용 때문에 요소마다 자기만의 작은 레이어로 나눈다. SVG 안쪽 요소의 transform 은 따로 합성되지 못하고
// 매번 SVG 전체를 다시 그리므로, 1920×1080 SVG 하나에 몰아 두면 공전·카메라 이동이 프레임마다 전체를 다시 그리게 된다.
//   · 계속 도는 것(공전·카운터 회전·카메라 이동)은 HTML 레이어의 transform 만 바꾼다 → 합성기가 처리
//   · 전환 중에만 바뀌는 것(반지름·점선·호버)은 그 요소만 든 작은 SVG 안에서 바뀐다 → 다시 그려도 작다
//
// will-change 는 일부러 쓰지 않는다. 측정해 보니 이 계층 어디에 두든 1px 선(링)이 흐려지고(최대 밝기 220 → 약 200),
// 전환 구간 프레임 드랍도 더 나빠지거나 같았다. 공전하는 CSS 애니메이션과 기울기(3D transform)가 이미 레이어로 올린다.

const INK = '#e9e6f2'
type AB = Record<'a' | 'b', TargetAndTransition>

/** 원 중심 (중앙 묶음 안의 좌표) */
const CX = 800
const CY = 540

/** 원 중심에 놓인, 한 변이 2*half 인 레이어 */
const centered = (half: number): CSSProperties => ({
  position: 'absolute',
  left: CX - half,
  top: CY - half,
  width: half * 2,
  height: half * 2,
  pointerEvents: 'none',
})

/** 작은 흰 원(r44): B 로 갈 때 1.35배로 커졌다 사라지고, A 로 돌아올 땐 마지막에 팝하며 등장 */
const core = {
  a: { scale: [0, 1.08, 1], opacity: [0, 1, 1], transition: { ...tr(B_TO_A.core), times: [0, 0.7, 1] } },
  b: { scale: [1, 1.35, 0], opacity: [1, 1, 0], transition: { ...tr(A_TO_B.core), times: [0, 0.35, 1] } },
} satisfies AB

/** 회색 실선 원: 색과 사라짐. 크기(r130 ↔ r270)는 아래 useRingScale */
const solidRing = {
  a: {
    stroke: 'rgba(233,230,242,0.16)',
    opacity: 1,
    transition: { default: tr(B_TO_A.solidRing), opacity: tr(B_TO_A.ringHandoff) },
  },
  b: {
    stroke: 'rgba(233,230,242,0.14)',
    opacity: 0,
    transition: { default: tr(A_TO_B.solidRing), opacity: tr(A_TO_B.ringHandoff) },
  },
} satisfies AB

/** 회색 파선 원(r200): 1.25배로 퍼지며 사라짐 */
const dashedRing = {
  a: { scale: 1, stroke: 'rgba(233,230,242,0.38)', transition: tr(B_TO_A.dashedRing) },
  b: { scale: 1.25, stroke: 'rgba(233,230,242,0)', transition: tr(A_TO_B.dashedRing) },
} satisfies AB

/** 흰 큰 원: 틈(A)이 닫히고(B) 사라짐. 크기(r270 ↔ r330)는 아래 useRingScale */
const whiteRing = {
  a: {
    strokeDasharray: '88.4 11.6',
    opacity: 1,
    transition: { default: tr(B_TO_A.whiteRing), opacity: tr(B_TO_A.ringHandoff) },
  },
  b: {
    strokeDasharray: '100 0',
    opacity: 0,
    transition: { default: tr(A_TO_B.whiteRing), opacity: tr(A_TO_B.ringHandoff) },
  },
} satisfies AB

/** 궤도(틈이 있는 원)와 그 위의 대상들이 나타났다 사라짐 */
const orbitFade = {
  a: { opacity: 0, transition: tr(B_TO_A.orbitFade) },
  b: { opacity: 1, transition: tr(A_TO_B.orbitFade) },
} satisfies AB

/** 부유하는 배·조각난 세계: 팝(1.18배)과 함께 등장, 돌아갈 땐 부풀지 않고 작아짐 */
const markerPop = {
  a: { scale: 0, opacity: 0, transition: tr(B_TO_A.markerOut) },
  b: {
    scale: [0, 1.18, 0.96, 1],
    opacity: 1,
    transition: {
      ...tr(A_TO_B.markerPop),
      times: [0, 0.6, 0.8, 1],
      opacity: { delay: A_TO_B.markerPop.at, duration: 0 },
    },
  },
} satisfies AB

/**
 * 원 반지름 애니메이션 (프로토타입 방식): 실제 반지름 원을 만들어 두고 scale(≤1)로 키운다.
 * scale 하면 선도 같이 굵어지므로 stroke-width = 1/scale 로 보정해 화면에서는 늘 1px 로 보이게 한다.
 * pathLength 로 정규화한 점선(틈)은 scale 과 무관하게 같은 비율을 유지한다.
 */
function useRingScale(from: number, step: Step, toB: Cue, toA: Cue) {
  const scale = useMotionValue(from)
  const strokeWidth = useTransform(scale, (s) => 1 / s)
  useEffect(() => {
    const ctrl = animate(scale, step === 1 ? 1 : from, tr(step === 1 ? toB : toA))
    return () => ctrl.stop()
  }, [scale, step, from, toB, toA])
  return { scale, strokeWidth }
}

/** 회색 실선 원: r130(A) → r270(B) */
function SolidRing() {
  const { step, camera } = useScene()
  const { scale, strokeWidth } = useRingScale(130 / 270, step, A_TO_B.solidRing, B_TO_A.solidRing)
  const half = 272
  return (
    <motion.div aria-hidden style={{ ...centered(half), x: camera.gray.x, y: camera.gray.y }}>
      <svg width={half * 2} height={half * 2} style={{ display: 'block' }}>
        <motion.circle
          cx={half}
          cy={half}
          r={270}
          fill="none"
          strokeDasharray="100 0"
          initial={false}
          animate={solidRing[step === 1 ? 'b' : 'a']}
          style={{ scale, strokeWidth }}
        />
      </svg>
    </motion.div>
  )
}

/** 회색 파선 원 (r200): 천천히 돌고(CSS), 전환 때 퍼지며 사라진다 */
function DashedRing() {
  const { step } = useScene()
  // 전환 때 1.25배까지 퍼진다(200 × 1.25 = 250)
  const half = 256
  return (
    <div
      aria-hidden
      style={{ ...centered(half), animation: 'spin 140s linear infinite' }}
    >
      <svg width={half * 2} height={half * 2} style={{ display: 'block', overflow: 'visible' }}>
        <motion.circle
          cx={half}
          cy={half}
          r={200}
          fill="none"
          strokeWidth={1}
          strokeDasharray="10 14"
          initial={false}
          animate={dashedRing[step === 1 ? 'b' : 'a']}
        />
      </svg>
    </div>
  )
}

/** 작은 흰 원 (r44) */
function Core() {
  const { step } = useScene()
  // 전환 때 1.35배까지 커진다(44 × 1.35 = 59.4). 상자가 이보다 작으면 커진 원이 네모로 잘린다.
  const half = 64
  return (
    <div aria-hidden style={centered(half)}>
      <svg width={half * 2} height={half * 2} style={{ display: 'block', overflow: 'visible' }}>
        <motion.circle
          cx={half}
          cy={half}
          r={44}
          fill="none"
          stroke={INK}
          strokeWidth={1}
          initial={false}
          animate={core[step === 1 ? 'b' : 'a']}
        />
      </svg>
    </div>
  )
}

/** 흰 큰 원 (r270 → r330). A 에서는 틈이 있고, B 로 가며 닫힌다 */
function WhiteRing() {
  const { step, camera } = useScene()
  const { scale, strokeWidth } = useRingScale(270 / 330, step, A_TO_B.whiteRing, B_TO_A.whiteRing)
  const ref = useRef<SVGCircleElement>(null)
  // Motion 은 pathLength 속성을 자기 그리기 값으로 가로채므로, 정규화 길이(100)는 직접 건다.
  useLayoutEffect(() => {
    ref.current?.setAttribute('pathLength', '100')
  }, [])
  const half = 332
  return (
    <motion.div aria-hidden style={{ ...centered(half), x: camera.white.x, y: camera.white.y }}>
      <svg width={half * 2} height={half * 2} style={{ display: 'block' }}>
        <g transform={`rotate(21 ${half} ${half})`}>
          <motion.circle
            ref={ref}
            cx={half}
            cy={half}
            r={330}
            fill="none"
            stroke="rgba(233,230,242,0.85)"
            initial={false}
            animate={whiteRing[step === 1 ? 'b' : 'a']}
            style={{ scale, strokeWidth }}
          />
        </g>
      </svg>
    </motion.div>
  )
}

interface OrbitSpec {
  id: OrbitId
  ringR: number
  dash: string
  ringRotate: number
  /** 궤도 위의 작은 점 두 개 (원 중심 기준 좌표) */
  dots: [number, number][]
  /** 궤도 공전: 이름(orbit | orbitRev), 시간(초) */
  spin: { name: 'orbit' | 'orbitRev'; sec: number }
  /** 대상이 똑바로 서 있게 하는 반대 방향 회전 */
  counter: { name: 'orbit' | 'orbitRev'; sec: number }
  cam: 'white' | 'gray'
}

const SHIP: OrbitSpec = {
  id: 'ship',
  ringR: 330,
  dash: '95 5',
  ringRotate: -81,
  dots: [
    [851.6 - CX, 214.1 - CY],
    [748.4 - CX, 214.1 - CY],
  ],
  spin: { name: 'orbit', sec: 260 },
  counter: { name: 'orbitRev', sec: 260 },
  cam: 'white',
}

const FRAGMENT: OrbitSpec = {
  id: 'fragment',
  ringR: 270,
  dash: '96.9 3.1',
  ringRotate: 155.58,
  dots: [
    [580.4 - CX, 697.1 - CY],
    [554.2 - CX, 651.6 - CY],
  ],
  spin: { name: 'orbitRev', sec: 150 },
  counter: { name: 'orbit', sec: 150 },
  cam: 'gray',
}

/** 대상 하나가 자기 자리에서 그려지는 160×160 레이어의 한 변 */
const M = 160
const MH = M / 2

function Marker({ spec, counterAnim, left, top }: { spec: OrbitSpec; counterAnim: string; left: number; top: number }) {
  const { step, hover, sel, setHover, toggle } = useScene()
  const o = ORBITS[spec.id]
  const world = worldAt(spec.id)
  const selected = sel === spec.id
  const active = hover === spec.id || selected
  const tap = useAnimationControls()
  const full: CSSProperties = { position: 'absolute', left: 0, top: 0, width: M, height: M }

  return (
    <div aria-hidden={!world} style={{ ...full, left, top, animation: counterAnim }}>
      <motion.div initial={false} animate={markerPop[step === 1 ? 'b' : 'a']} style={full}>
        {world ? (
          <>
            <motion.div animate={tap} style={full}>
              <svg width={M} height={M} style={{ position: 'absolute', left: 0, top: 0 }}>
                <motion.circle
                  cx={MH}
                  cy={MH}
                  r={o.ringR}
                  fill="none"
                  stroke={INK}
                  strokeWidth={1}
                  initial={false}
                  animate={{ scale: active ? RING_SCALE : 1 }}
                  transition={RING_HOVER}
                />
                <motion.circle
                  cx={MH}
                  cy={MH}
                  r={o.dotR}
                  fill="#ffffff"
                  initial={false}
                  animate={{ scale: selected ? 1 : 0 }}
                  transition={DOT_HOVER_ORBIT}
                />
              </svg>
              {/* 선택됐을 때 2초마다 퍼지는 파동 (transform/opacity 만 쓰는 HTML 요소) */}
              <span
                style={{
                  position: 'absolute',
                  left: MH - o.ringR,
                  top: MH - o.ringR,
                  width: o.ringR * 2,
                  height: o.ringR * 2,
                  boxSizing: 'border-box',
                  border: '1px solid rgba(214,210,232,0.6)',
                  borderRadius: '50%',
                  opacity: 0,
                  pointerEvents: 'none',
                  animation: selected ? 'shipWave 2s cubic-bezier(.2,.6,.3,1) infinite' : 'none',
                }}
              />
            </motion.div>
            <svg width={M} height={M} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
              <motion.text
                x={MH}
                y={MH + (o.labelY - o.y)}
                textAnchor="middle"
                fill={INK}
                initial={false}
                animate={{ opacity: active ? 1 : 0 }}
                transition={LABEL_FADE}
                style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.08em' }}
              >
                {world.label}
              </motion.text>
              <motion.circle
                cx={MH}
                cy={MH + (o.markY - o.y)}
                r={1.5}
                fill={INK}
                initial={false}
                animate={{ opacity: selected ? 1 : 0 }}
                transition={LABEL_FADE}
              />
            </svg>
            <div
              onMouseEnter={() => setHover(spec.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                toggle(spec.id)
                tap.start({ scale: TAP_KEYFRAMES_ORBIT, transition: TAP_POP })
              }}
              style={{
                position: 'absolute',
                left: MH - o.hitR,
                top: MH - o.hitR,
                width: o.hitR * 2,
                height: o.hitR * 2,
                borderRadius: '50%',
                cursor: 'pointer',
                pointerEvents: step === 1 ? 'auto' : 'none',
              }}
            />
          </>
        ) : (
          // YAML 이 없는 자리: 작은 점, 클릭할 수 없음
          <svg width={M} height={M} style={{ position: 'absolute', left: 0, top: 0 }}>
            <circle cx={MH} cy={MH} r={o.dotR} fill={INK} opacity={0.85} />
          </svg>
        )}
      </motion.div>
    </div>
  )
}

/** 틈이 있는 궤도 원 하나와 그 위의 대상 하나. 궤도가 돌고(CSS), 대상은 반대로 돌아 똑바로 선다 */
function OrbitLayer({ spec }: { spec: OrbitSpec }) {
  const { step, visits, camera } = useScene()
  const o = ORBITS[spec.id]
  const parity = visits % 2 ? 'A' : 'B'
  const run = step === 1 ? '' : ' paused'
  const half = spec.ringR + 2
  const cam = camera[spec.cam]
  // 대상의 자리: 원 중심 기준 좌표 → 이 레이어 안의 좌표 (대상 레이어는 160×160)
  const left = half + (o.x - CX) - MH
  const top = half + (o.y - CY) - MH

  return (
    <motion.div
      initial={false}
      animate={orbitFade[step === 1 ? 'b' : 'a']}
      style={{ ...centered(half), x: cam.x, y: cam.y }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: `${spec.spin.name}${parity} ${spec.spin.sec}s linear 2.5s infinite${run}`,
        }}
      >
        <svg width={half * 2} height={half * 2} style={{ display: 'block', position: 'absolute', left: 0, top: 0 }}>
          <circle
            aria-hidden
            cx={half}
            cy={half}
            r={spec.ringR}
            pathLength={100}
            fill="none"
            stroke="rgba(233,230,242,0.85)"
            strokeWidth={1}
            strokeDasharray={spec.dash}
            transform={`rotate(${spec.ringRotate} ${half} ${half})`}
            style={spec.cam === 'gray' ? { stroke: 'rgba(233,230,242,0.14)' } : undefined}
          />
          {spec.dots.map(([dx, dy], i) => (
            <circle
              key={i}
              aria-hidden
              cx={half + dx}
              cy={half + dy}
              r={spec.cam === 'gray' ? 1.6 : 1.8}
              fill={spec.cam === 'gray' ? 'rgba(233,230,242,0.38)' : 'rgba(233,230,242,0.85)'}
            />
          ))}
        </svg>
        <Marker
          spec={spec}
          left={left}
          top={top}
          counterAnim={`${spec.counter.name}${parity} ${spec.counter.sec}s linear 2.5s infinite${run}`}
        />
      </div>
    </motion.div>
  )
}

export function Orbits() {
  const { camera } = useScene()

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        pointerEvents: 'none',
        transformOrigin: CAMERA.origin,
        transformPerspective: CAMERA.perspective,
        rotateX: camera.rotateX,
        rotateY: camera.rotateY,
      }}
    >
      <SolidRing />
      <DashedRing />
      <Core />
      <WhiteRing />
      <OrbitLayer spec={FRAGMENT} />
      <OrbitLayer spec={SHIP} />
    </motion.div>
  )
}
