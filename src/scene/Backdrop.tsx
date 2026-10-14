import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { A_TO_B, B_TO_A, tr } from '../motion/transition'
import { CENTER_W, STAGE_H, computeLayout } from './layout'
import { useScene } from './scene'

// 뷰포트 전체에 깔리는 배경: 블러(빛무리) + 먼지 + 필름 노이즈. 어느 것에도 filter·SVG 필터는 쓰지 않는다.
// (남색 그라디언트는 .viewport 가 맡는다. 프로토타입에 비네트는 없다.)
//
// 블러와 먼지는 무대와 같은 단위·배율을 쓰되 무대보다 넓은 뷰포트 전체를 덮는 컨테이너(.backdrop)에 둔다.

const glow = {
  a: { x: 780, transition: tr(B_TO_A.glow) },
  b: { x: 960, transition: tr(A_TO_B.glow) },
}

/**
 * 블러 원. 원래는 620×520 타원 안의 radial-gradient 에 filter: blur(36px) 를 걸었다.
 * filter 는 움직이는 레이어에서 비싸므로, 같은 블러 결과(가우시안 σ=36)를 수치로 계산해
 * 다중 정지점 radial-gradient 하나로 옮겼다. 중심은 원래 타원의 중심(310, 540)과 같다.
 */
const GLOW = (() => {
  const half = 384
  const stops = [
    0.2174, 0.2142, 0.2052, 0.192, 0.1762, 0.1592, 0.1414, 0.1233, 0.1049, 0.0865, 0.0681, 0.0501, 0.0335, 0.0197,
    0.0099, 0.0041, 0.0013, 0.0003, 0.0001, 0,
  ]
    .map((a, i) => `rgba(170,164,206,${a}) ${i * 20}px`)
    .join(', ')
  return {
    size: half * 2,
    left: 310 - half,
    top: 540 - half,
    background: `radial-gradient(circle ${half}px at center, ${stops}, rgba(170,164,206,0) ${half}px)`,
  }
})()

const ANIMS = ['dustA', 'dustB', 'dustC']

/** 1920×1080 일 때의 먼지 개수. 면적이 넓어지면 비례해서 늘어나고, 상한(MAX_DUST)에서 멈춘다 */
const BASE_DUST = 34
const MAX_DUST = 64

// 프로토타입과 같은 시드. 앞 34개는 프로토타입과 같은 자리에 놓인다(위치는 뷰포트 비율).
const dust = (() => {
  let s = 7
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  return Array.from({ length: MAX_DUST }, (_, i) => ({
    x: rnd(),
    y: rnd(),
    size: (rnd() * 1.8 + 0.6).toFixed(1),
    opacity: (rnd() * 0.4 + 0.12).toFixed(2),
    blur: rnd() < 0.35 ? 1 : 0,
    dur: Math.round(rnd() * 24 + 24),
    delay: -Math.round(rnd() * 30),
    anim: ANIMS[i % 3],
  }))
})()

function dustCount() {
  const { s } = computeLayout(window.innerWidth, window.innerHeight)
  const units = (window.innerWidth / s) * (window.innerHeight / s)
  return Math.min(MAX_DUST, Math.max(8, Math.round((BASE_DUST * units) / (CENTER_W * STAGE_H))))
}

function useDustCount() {
  const [count, setCount] = useState(dustCount)
  useEffect(() => {
    const onResize = () => setCount(dustCount())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return count
}

export function Backdrop() {
  const { step, camera } = useScene()
  const count = useDustCount()

  return (
    <>
      <div aria-hidden className="backdrop">
        {/* 중앙 기준 묶음: 원 중심 x = W/2 − 160 에 맞춰 따라다닌다 */}
        <motion.div className="backdrop-center" style={{ x: camera.glow.x, y: camera.glow.y }}>
          <motion.div
            initial={false}
            animate={step === 1 ? glow.b : glow.a}
            style={{
              position: 'absolute',
              left: GLOW.left,
              top: GLOW.top,
              width: GLOW.size,
              height: GLOW.size,
              background: GLOW.background,
            }}
          />
        </motion.div>

        {dust.slice(0, count).map((d, i) => {
          // filter: blur(1px) 대신, 번진 점은 가장자리가 부드러운 그라디언트로 그린다 (애니메이션은 transform 만)
          const size = d.blur ? Number(d.size) + 2 : Number(d.size)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${d.x * 100}%`,
                top: `${d.y * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                marginLeft: d.blur ? -1 : 0,
                marginTop: d.blur ? -1 : 0,
                borderRadius: '50%',
                background: d.blur
                  ? 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0) 100%)'
                  : '#ffffff',
                opacity: d.opacity,
                animation: `${d.anim} ${d.dur}s ease-in-out ${d.delay}s infinite alternate`,
              }}
            />
          )
        })}
      </div>

      {/* 필름 노이즈: 작은 PNG 타일을 깔 뿐이다 (움직이지 않음) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/noise.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
          pointerEvents: 'none',
        }}
      />
    </>
  )
}
