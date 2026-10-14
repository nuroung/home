import { motion, useAnimationControls } from 'motion/react'
import {
  ORBITS,
  STARS,
  STAR_LINE_GAP,
  STAR_RING,
  STAR_SEGMENTS,
  type OrbitId,
  type StarId,
} from '../data/anchors'
import { worldAt } from '../data/worlds'
import { CAMERA } from '../motion/camera'
import {
  AURA_OPACITY,
  AURA_SCALE,
  DOT_HOVER_STAR,
  DOT_SCALE,
  RING_HOVER,
  RING_SCALE,
  TAP_KEYFRAMES_STAR,
  TAP_POP,
} from '../motion/interaction'
import { panelFade } from '../motion/targets'
import { useScene } from './scene'

// 오리온자리: 선, 작은 점 별, ◉ 별.  YAML 이 있는 자리만 ◉(클릭 가능), 없으면 작은 점.

const starIds = Object.keys(STARS) as StarId[]
const litIds = starIds.filter((id) => worldAt(id))
const dimIds = starIds.filter((id) => !worldAt(id))

/** ◉ 별 주변은 비켜 가며 선을 긋는다 */
const linePath = STAR_SEGMENTS.map(([a, b]) => {
  const { x: x1, y: y1 } = STARS[a]
  const { x: x2, y: y2 } = STARS[b]
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ta = worldAt(a) ? STAR_LINE_GAP : 0
  const tb = worldAt(b) ? STAR_LINE_GAP : 0
  if (ta + tb >= len - 2) return ''
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  return `M${(x1 + ux * ta).toFixed(1)} ${(y1 + uy * ta).toFixed(1)}L${(x2 - ux * tb).toFixed(1)} ${(y2 - uy * tb).toFixed(1)}`
}).join('')

/** 선이 그려지는 영역(별 좌표의 바운딩 박스 + 여백) */
const LINES_BOX = (() => {
  const xs = starIds.map((id) => STARS[id].x)
  const ys = starIds.map((id) => STARS[id].y)
  const pad = 8
  const x = Math.floor(Math.min(...xs)) - pad
  const y = Math.floor(Math.min(...ys)) - pad
  return { x, y, w: Math.ceil(Math.max(...xs)) + pad - x, h: Math.ceil(Math.max(...ys)) + pad - y }
})()

function Star({ id }: { id: StarId }) {
  const { step, hover, sel, setHover, toggle } = useScene()
  const s = STARS[id]
  const world = worldAt(id)!
  const selected = sel === id
  const hovered = hover === id
  const active = hovered || selected
  const tap = useAnimationControls()

  const { d: ringD, dot: dotD, box } = STAR_RING
  const c = box / 2
  const enter = () => setHover(id)
  const leave = () => setHover(null)

  return (
    <button
      type="button"
      className={selected ? 'star sel' : 'star'}
      aria-label={world.label}
      aria-pressed={selected}
      onClick={() => {
        toggle(id)
        tap.start({ scale: TAP_KEYFRAMES_STAR, transition: TAP_POP })
      }}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      style={{ left: s.x - c, top: s.y - c, width: box, height: box, pointerEvents: step === 1 ? 'auto' : 'none' }}
    >
      <motion.span
        className="aura"
        initial={false}
        animate={{ opacity: hovered ? 0.85 : 0, scale: hovered ? 1 : 0.6 }}
        transition={{ opacity: AURA_OPACITY, scale: AURA_SCALE }}
        style={{ width: 72, height: 72, left: c - 36, top: c - 36 }}
      />
      <span
        className="ripple"
        style={{
          width: ringD,
          height: ringD,
          left: c - ringD / 2,
          top: c - ringD / 2,
          animation: selected ? 'wave 2s cubic-bezier(.2,.6,.3,1) infinite' : 'none',
        }}
      />
      <motion.span className="core" animate={tap} style={{ left: c, top: c }}>
        <motion.span
          className="ring"
          initial={false}
          animate={{ scale: active ? RING_SCALE : 1 }}
          transition={RING_HOVER}
          style={{
            width: ringD,
            height: ringD,
            left: -ringD / 2,
            top: -ringD / 2,
            animation: `starBlink ${s.blinkDur}s ease-in-out ${s.blinkDelay}s infinite`,
          }}
        />
        <motion.span
          className="dot"
          initial={false}
          animate={{ scale: active ? DOT_SCALE : 1 }}
          transition={DOT_HOVER_STAR}
          style={{
            width: dotD,
            height: dotD,
            left: -dotD / 2,
            top: -dotD / 2,
            animation: `starBlink ${s.blinkDur}s ease-in-out ${s.blinkDelay}s infinite`,
          }}
        />
      </motion.span>
      {active && (
        <span className="label" style={{ top: c + ringD * 0.7 + 8 }}>
          {world.label}
        </span>
      )}
      {selected && <span className="mark" style={{ top: c + ringD * 0.7 + 32 }} />}
    </button>
  )
}

/** 배·조각난 세계는 궤도를 따라 움직이므로 눈에 안 보이는 키보드용 버튼만 둔다 */
function OrbitKeyboardButton({ id }: { id: OrbitId }) {
  const { sel, setHover, toggle } = useScene()
  const world = worldAt(id)
  if (!world) return null
  return (
    <button
      type="button"
      aria-label={world.label}
      aria-pressed={sel === id}
      onFocus={() => setHover(id)}
      onBlur={() => setHover(null)}
      onClick={() => toggle(id)}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1,
        height: 1,
        padding: 0,
        border: 0,
        overflow: 'hidden',
        opacity: 0,
      }}
    />
  )
}

export function Constellation() {
  const { step, camera } = useScene()

  return (
    <motion.div
      initial={false}
      animate={step === 1 ? panelFade.b : panelFade.a}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        transformOrigin: CAMERA.origin,
        transformPerspective: CAMERA.perspective,
        rotateX: camera.rotateX,
        rotateY: camera.rotateY,
      }}
    >
      {(Object.keys(ORBITS) as OrbitId[]).map((id) => (
        <OrbitKeyboardButton key={id} id={id} />
      ))}

      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          x: camera.stars.x,
          y: camera.stars.y,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', animation: 'floatC 7s ease-in-out infinite' }}>
          {/* 선: 움직이지 않으므로 한 번만 그려지는 작은 SVG. 좌표계는 그대로 두고 필요한 영역만 잘라 쓴다 */}
          <svg
            aria-hidden
            width={LINES_BOX.w}
            height={LINES_BOX.h}
            viewBox={`${LINES_BOX.x} ${LINES_BOX.y} ${LINES_BOX.w} ${LINES_BOX.h}`}
            style={{ position: 'absolute', left: LINES_BOX.x, top: LINES_BOX.y, pointerEvents: 'none' }}
          >
            <path d={linePath} fill="none" stroke="rgba(233,230,242,0.22)" strokeWidth={1} />
          </svg>
          {/* 작은 점 별: 깜빡임(opacity)만 쓰므로 HTML 요소로 둬서 합성기가 처리하게 한다 */}
          {dimIds.map((id) => {
            const s = STARS[id]
            return (
              <span
                key={id}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: s.x - s.dotR,
                  top: s.y - s.dotR,
                  width: s.dotR * 2,
                  height: s.dotR * 2,
                  borderRadius: '50%',
                  background: '#e9e6f2',
                  opacity: 0.85,
                  pointerEvents: 'none',
                  animation: `starBlinkDim ${s.blinkDur}s ease-in-out ${s.blinkDelay}s infinite`,
                }}
              />
            )
          })}

          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 892,
              top: 622,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.5em',
              color: 'rgba(233,230,242,0.38)',
              pointerEvents: 'none',
            }}
          >
            ORION
          </span>

          {litIds.map((id) => (
            <Star key={id} id={id} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
