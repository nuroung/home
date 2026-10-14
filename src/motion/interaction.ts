import type { Transition } from 'motion/react'

// 호버·선택·클릭 팝의 타이밍. (A↔B 전환 타이밍은 transition.ts)

const ringEase = [0.2, 0.7, 0.2, 1] as const

/** 고리가 1.4배로 커지고(호버·선택), 점이 작아지는 움직임 */
export const RING_HOVER: Transition = { duration: 0.5, ease: [...ringEase] }
export const DOT_HOVER_STAR: Transition = { duration: 0.5, ease: [...ringEase] }
export const DOT_HOVER_ORBIT: Transition = { duration: 0.45, ease: [0.3, 0, 0.2, 1.4] }

export const RING_SCALE = 1.4
export const DOT_SCALE = 0.6

/** 별의 아우라 */
export const AURA_OPACITY: Transition = { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }
export const AURA_SCALE: Transition = { duration: 1, ease: [...ringEase] }

/** 라벨·아래 점이 나타나는 속도 */
export const LABEL_FADE: Transition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }

/** 클릭 팝: 0.7배로 움츠렸다 확 커진 뒤 제자리 */
export const TAP_POP: Transition = {
  duration: 0.6,
  ease: [0.3, 0, 0.2, 1],
  times: [0, 0.3, 0.65, 1],
}
export const TAP_KEYFRAMES_STAR = [1, 0.7, 1.35, 1]
export const TAP_KEYFRAMES_ORBIT = [1, 0.7, 1.3, 1]

/** 패널 글자 타이핑 */
export const TYPE_STEP = 0.035
export const TYPE_START = 0.05
export const TYPE_GAP = 0.12

/**
 * 본문(content)에서 느리게 찍는 곳(초). 글자 사이 기본 간격(TYPE_STEP)에 더해진다.
 * 쉼표(,)와 말줄임표(...)만 쉬고, 홑마침표(.)는 보통 속도로 찍는다.
 */
export const TYPE_PAUSE_COMMA = 0.2
/** 말줄임표: 앞의 점들은 짧게, 마지막 점은 길게 쉰다 */
export const TYPE_PAUSE_ELLIPSIS = 0.15
export const TYPE_PAUSE_ELLIPSIS_END = 0.45
