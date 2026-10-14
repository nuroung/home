import { motion, useAnimationControls } from 'motion/react'
import {
  ORBITS,
  STARS,
  STAR_LINE_GAP,
  STAR_PATH,
  STAR_SEGMENTS,
  STAR_SHAPE,
  type OrbitId,
  type StarId,
} from '../data/anchors'
import { worldAt } from '../data/worlds'
import { CAMERA } from '../motion/camera'
import {
  AURA_OPACITY,
  AURA_SCALE,
  RING_HOVER,
  TAP_KEYFRAMES_STAR,
  TAP_POP,
} from '../motion/interaction'
import { panelFade } from '../motion/targets'
import { useScene } from './scene'

// 오리온자리: 선, 작은 점 별, 지정 별(✦).  YAML 이 있는 자리만 지정 별(클릭 가능), 없으면 작은 점.

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
  const big = hovered || selected // 호버·선택이면 ×1.4
  const tap = useAnimationControls()

  const { box, size, hoverScale, half, wave } = STAR_SHAPE
  const c = box / 2
  const bigHalf = (size * hoverScale) / 2 // 커졌을 때의 반지름(px)
  const labelTop = c + bigHalf + 8
  const color = selected ? '#ffffff' : '#e9e6f2'
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
      {/* 선택 시 퍼지는 원형 파동. scale 로 키우면 선이 같이 굵어지므로 width/height 를 키운다.
          바깥 상자(contain)가 크기 변화의 영향을 이 안으로 가둔다. */}
      {selected && (
        <span
          className="star-wave-box"
          style={{ left: c, top: c, width: wave.to, height: wave.to, marginLeft: -wave.to / 2, marginTop: -wave.to / 2 }}
        >
          <span
            className="star-wave"
            style={
              {
                '--wave-from': `${wave.from}px`,
                '--wave-to': `${wave.to}px`,
                '--wave-line': `${wave.lineWidth}px`,
              } as React.CSSProperties
            }
          />
        </span>
      )}
      {/* 클릭 팝(.7→1.35→1) ▸ 호버·선택 크기(×1.4) ▸ 천천히 도는 회전 ▸ 다이아몬드.
          크기와 회전이 같은 요소의 transform 을 두고 부딪히지 않도록 요소를 나눴다. */}
      <motion.span className="core" animate={tap} style={{ left: c, top: c }}>
        <motion.span
          className="star-size"
          initial={false}
          animate={{ scale: big ? hoverScale : 1 }}
          transition={RING_HOVER}
          style={{ width: size, height: size, left: -size / 2, top: -size / 2 }}
        >
          <span className="star-spin" style={{ animation: `spin ${STAR_SHAPE.spinSec}s linear infinite` }}>
            <svg
              aria-hidden
              width={size}
              height={size}
              viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
              style={{
                display: 'block',
                overflow: 'visible',
                // 선택되면 깜빡임을 멈추고 순수 흰색으로 고정한다
                animation: selected ? 'none' : `starBlink ${s.blinkDur}s ease-in-out ${s.blinkDelay}s infinite`,
              }}
            >
              <path d={STAR_PATH} fill={color} stroke={color} strokeWidth={1} />
            </svg>
          </span>
        </motion.span>
      </motion.span>
      {big && (
        <span className="label" style={{ top: labelTop }}>
          {world.label}
        </span>
      )}
      {selected && <span className="mark" style={{ top: labelTop + 24 }} />}
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
