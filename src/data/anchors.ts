// 화면에서 세계 정보가 붙을 수 있는 자리(anchor)와 좌표.
// Vite 플러그인(검증)과 화면이 같이 쓰므로 DOM/React에 의존하지 않는다.

export interface StarAnchor {
  x: number
  y: number
  /** YAML이 없을 때 그려지는 작은 점의 반지름 */
  dotR: number
  /** 깜빡임 주기(초)와 지연(초) */
  blinkDur: number
  blinkDelay: number
}

export const STARS = {
  world2153: { x: 888, y: 388, dotR: 3, blinkDur: 4.6, blinkDelay: -1.2 },
  world3605: { x: 786, y: 382, dotR: 3, blinkDur: 5.8, blinkDelay: -3.0 },
  bellatrix: { x: 895, y: 468, dotR: 3, blinkDur: 3.7, blinkDelay: -1.8 },
  mintaka: { x: 808, y: 559, dotR: 2.7, blinkDur: 5.2, blinkDelay: -0.9 },
  alnilam: { x: 782, y: 564, dotR: 3, blinkDur: 4.4, blinkDelay: -2.6 },
  world2146: { x: 757, y: 564, dotR: 3, blinkDur: 4.1, blinkDelay: -0.4 },
  saiph: { x: 657, y: 670, dotR: 3, blinkDur: 6.1, blinkDelay: -1.5 },
  world6178: { x: 804, y: 725, dotR: 3, blinkDur: 6.4, blinkDelay: -2.2 },
} as const satisfies Record<string, StarAnchor>

export type StarId = keyof typeof STARS

/** 별자리 선 (오리온) */
export const STAR_SEGMENTS: [StarId, StarId][] = [
  ['world2153', 'world3605'],
  ['world2153', 'bellatrix'],
  ['world3605', 'world2146'],
  ['bellatrix', 'mintaka'],
  ['mintaka', 'alnilam'],
  ['alnilam', 'world2146'],
  ['world2146', 'saiph'],
  ['mintaka', 'world6178'],
]

/** 지정 별(YAML 이 있는 별)에서 별자리 선이 비켜 가는 거리(px) */
export const STAR_LINE_GAP = 8

/**
 * 지정 별의 모양: 속이 꽉 찬 오목한 다이아몬드(✦) 하나.
 * 경로는 viewBox -7 -7 14 14 안에서 그리고, Q 제어점(concavity)이 클수록 덜 오목하다.
 */
export const STAR_SHAPE = {
  /** 클릭·호버를 받는 영역(px) */
  box: 52,
  /** 기본 크기(px, 정사각형 틀) */
  size: 10,
  /** 호버·선택 때 커지는 배율 (10px → 14px) */
  hoverScale: 1.4,
  /** 오목한 깊이: Q 제어점 값. 0 이면 마름모의 중심을 지나는 직선, 7 이면 정사각형에 가까운 볼록 쪽 */
  concavity: 1.4,
  /** viewBox 의 반 변 */
  half: 7,
  /** 제자리에서 한 바퀴 도는 시간(초) */
  spinSec: 40,
  /** 선택 시 퍼지는 파동: 지름 from → to (px), 선 두께(px) */
  wave: { from: 14, to: 46, lineWidth: 0.6 },
} as const

/** 오목한 다이아몬드 경로 (viewBox -7 -7 14 14) */
export const STAR_PATH = (() => {
  const h = STAR_SHAPE.half
  const q = STAR_SHAPE.concavity
  return `M0,-${h} Q${q},-${q} ${h},0 Q${q},${q} 0,${h} Q-${q},${q} -${h},0 Q-${q},-${q} 0,-${h} Z`
})()

export interface OrbitAnchor {
  x: number
  y: number
  ringR: number
  dotR: number
  hitR: number
  labelY: number
  markY: number
}

export const ORBITS = {
  ship: { x: 800, y: 210, ringR: 14, dotR: 3, hitR: 30, labelY: 248, markY: 264 },
  fragment: { x: 566.2, y: 675.0, ringR: 10, dotR: 2.5, hitR: 22, labelY: 707, markY: 721 },
} as const satisfies Record<string, OrbitAnchor>

export type OrbitId = keyof typeof ORBITS

export type AnchorId = StarId | OrbitId

export const ANCHORS: AnchorId[] = [
  ...(Object.keys(STARS) as StarId[]),
  ...(Object.keys(ORBITS) as OrbitId[]),
]
