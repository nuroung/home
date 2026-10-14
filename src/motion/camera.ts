import { useCallback, useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'

// B 화면의 커서 카메라 무빙. 직접 짠 반복 루프 없이 useMotionValue + useSpring 으로 따라간다.
// 이동 폭은 명세의 카메라 무빙 표 그대로다.

const spring = (stiffness: number) => ({
  stiffness,
  damping: 2 * Math.sqrt(stiffness), // 출렁이지 않는 임계 감쇠
  mass: 1,
  restDelta: 0.0005,
})

export const CAMERA = {
  perspective: 1800,
  origin: '800px 540px',
  /** 전체 기울기(도) */
  tilt: { rotateY: 7, rotateX: 5 },
  /** 층별 이동 폭(px) */
  white: { x: 26, y: 18 },
  gray: { x: 14, y: 10 },
  stars: { x: 4, y: 3 },
  glow: { x: 18, y: 12 },
  text: { x: 6, y: 4 },
  /** 따라오는 속도: 기본 → 블러(조금 느리게) → 패널 글자(가장 느리게) */
  follow: spring(28),
  glowFollow: spring(18),
  textFollow: spring(11),
}

export interface XY {
  x: MotionValue<number>
  y: MotionValue<number>
}

export interface Camera {
  rotateX: MotionValue<number>
  rotateY: MotionValue<number>
  white: XY
  gray: XY
  stars: XY
  glow: XY
  text: XY
  /** 커서 위치(원 중심 기준 -1~1, scene/layout.ts 의 normalizePointer)를 목표로 삼는다 */
  move: (x: number, y: number) => void
  leave: () => void
}

/** active 가 false(A 화면)이면 목표가 0 으로 돌아가 카메라가 제자리로 온다. */
export function useCamera(active: boolean): Camera {
  const targetX = useMotionValue(0)
  const targetY = useMotionValue(0)
  const pointer = useRef({ x: 0, y: 0 })
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
    targetX.set(active ? pointer.current.x : 0)
    targetY.set(active ? pointer.current.y : 0)
  }, [active, targetX, targetY])

  const fx = useSpring(targetX, CAMERA.follow)
  const fy = useSpring(targetY, CAMERA.follow)
  const gx = useSpring(targetX, CAMERA.glowFollow)
  const gy = useSpring(targetY, CAMERA.glowFollow)
  const tx = useSpring(targetX, CAMERA.textFollow)
  const ty = useSpring(targetY, CAMERA.textFollow)

  const rotateY = useTransform(fx, (v) => v * CAMERA.tilt.rotateY)
  const rotateX = useTransform(fy, (v) => v * -CAMERA.tilt.rotateX)

  const whiteX = useTransform(fx, (v) => v * CAMERA.white.x)
  const whiteY = useTransform(fy, (v) => v * CAMERA.white.y)
  const grayX = useTransform(fx, (v) => v * CAMERA.gray.x)
  const grayY = useTransform(fy, (v) => v * CAMERA.gray.y)
  const starsX = useTransform(fx, (v) => v * CAMERA.stars.x)
  const starsY = useTransform(fy, (v) => v * CAMERA.stars.y)
  const glowX = useTransform(gx, (v) => v * CAMERA.glow.x)
  const glowY = useTransform(gy, (v) => v * CAMERA.glow.y)
  const textX = useTransform(tx, (v) => v * CAMERA.text.x)
  const textY = useTransform(ty, (v) => v * CAMERA.text.y)

  const move = useCallback(
    (x: number, y: number) => {
      pointer.current = { x, y }
      if (activeRef.current) {
        targetX.set(x)
        targetY.set(y)
      }
    },
    [targetX, targetY],
  )

  const leave = useCallback(() => {
    pointer.current = { x: 0, y: 0 }
    targetX.set(0)
    targetY.set(0)
  }, [targetX, targetY])

  return {
    rotateX,
    rotateY,
    white: { x: whiteX, y: whiteY },
    gray: { x: grayX, y: grayY },
    stars: { x: starsX, y: starsY },
    glow: { x: glowX, y: glowY },
    text: { x: textX, y: textY },
    move,
    leave,
  }
}
