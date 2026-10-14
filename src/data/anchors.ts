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
  meissa: { x: 888, y: 388, dotR: 3, blinkDur: 4.6, blinkDelay: -1.2 },
  betelgeuse: { x: 786, y: 382, dotR: 3, blinkDur: 5.8, blinkDelay: -3.0 },
  bellatrix: { x: 895, y: 468, dotR: 3, blinkDur: 3.7, blinkDelay: -1.8 },
  mintaka: { x: 808, y: 559, dotR: 2.7, blinkDur: 5.2, blinkDelay: -0.9 },
  alnilam: { x: 782, y: 564, dotR: 3, blinkDur: 4.4, blinkDelay: -2.6 },
  alnitak: { x: 757, y: 564, dotR: 3, blinkDur: 4.1, blinkDelay: -0.4 },
  saiph: { x: 657, y: 670, dotR: 3, blinkDur: 6.1, blinkDelay: -1.5 },
  rigel: { x: 804, y: 725, dotR: 3, blinkDur: 6.4, blinkDelay: -2.2 },
} as const satisfies Record<string, StarAnchor>

export type StarId = keyof typeof STARS

/** 별자리 선 (오리온) */
export const STAR_SEGMENTS: [StarId, StarId][] = [
  ['meissa', 'betelgeuse'],
  ['meissa', 'bellatrix'],
  ['betelgeuse', 'alnitak'],
  ['bellatrix', 'mintaka'],
  ['mintaka', 'alnilam'],
  ['alnilam', 'alnitak'],
  ['alnitak', 'saiph'],
  ['mintaka', 'rigel'],
]

/** ◉ 별 주변에서 선이 비켜 가는 거리 */
export const STAR_LINE_GAP = 15

/** ◉ 별의 고리 지름 / 점 지름 / 클릭 영역 */
export const STAR_RING = { d: 20, dot: 6, box: 52 }

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
