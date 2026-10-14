// 높이 기준 + 가로 확장 레이아웃.
//
// 무대 높이는 항상 1080 단위. 배율 s = innerHeight / 1080, 무대 너비는 innerWidth / s 단위로 늘어난다(레터박스 없음).
// 단, 너비가 1600 단위보다 좁아지면 배율을 s = innerWidth / 1600 으로 낮추고 세로 가운데에 놓는다.
//
// 원·궤도·별자리·블러·패널은 크기가 그대로이고(배율 s 만 적용), 위치만 기준점을 따라간다:
//   · 중앙 기준  : 원 중심 x = W/2 − 160 (원래 1920 에서의 800). 블러, 錄, 패널(W/2 + 290)이 같이 따라간다
//   · 가장자리   : 헤더 왼쪽 64, 메뉴 오른쪽 48, 아래 선 좌우 64
//   · 가운데     : 위 화살표(위쪽), 별똥별 스크롤 안내(아래쪽)

export const STAGE_H = 1080
export const MIN_STAGE_W = 1600

/** 중앙 기준 묶음의 원래 좌표계(1920 폭)와 그 안에서의 원 중심 */
export const CENTER_W = 1920
export const CIRCLE_X = 800
export const CIRCLE_Y = 540
/** 원 중심이 무대 가운데에서 왼쪽으로 떨어진 거리 */
export const CIRCLE_OFFSET = 160

export interface Layout {
  /** 배율 */
  s: number
  /** 무대 너비(단위) */
  w: number
  /** 무대 위쪽 여백(화면 px). 세로 가운데 정렬일 때만 0 이 아니다 */
  top: number
}

export function computeLayout(viewportW: number, viewportH: number): Layout {
  let s = viewportH / STAGE_H
  let w = viewportW / s
  if (w < MIN_STAGE_W) {
    s = viewportW / MIN_STAGE_W
    w = MIN_STAGE_W
  }
  return { s, w, top: (viewportH - STAGE_H * s) / 2 }
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v))

/**
 * 커서(무대 단위 좌표)를 카메라용 -1~1 로 바꾼다. 기준은 원 중심이다:
 * 원 중심이 0, 화면 왼쪽 끝이 -1, 오른쪽 끝이 +1, 위·아래는 무대 높이의 절반이 ±1.
 */
export function normalizePointer(px: number, py: number, stageW: number) {
  const cx = stageW / 2 - CIRCLE_OFFSET
  const dx = px - cx
  const x = dx / (dx >= 0 ? stageW - cx : cx)
  const y = (py - CIRCLE_Y) / CIRCLE_Y
  return { x: clamp(x), y: clamp(y) }
}
