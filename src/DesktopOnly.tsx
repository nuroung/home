import { useSyncExternalStore } from 'react'

// 폭 1024px 미만이거나, 주 입력이 터치(pointer: coarse, 태블릿 포함)면 사이트 대신 안내 화면을 보여 준다.
const QUERIES = ['(max-width: 1023.98px)', '(pointer: coarse)']

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((q) => window.matchMedia(q))
  lists.forEach((l) => l.addEventListener('change', onChange))
  return () => lists.forEach((l) => l.removeEventListener('change', onChange))
}

const getSnapshot = () => QUERIES.some((q) => window.matchMedia(q).matches)

/** 데스크톱이 아니면 true */
export function useDesktopOnly(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export function DesktopOnly() {
  return (
    <div className="gate">
      <div className="gate-header">浮遊船</div>
      <p className="gate-message">데스크톱에서 접속해 주세요</p>
      <div className="gate-line" />
    </div>
  )
}
