import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { AnchorId } from '../data/anchors'
import { useCamera } from '../motion/camera'
import { LOCK_MS } from '../motion/transition'
import { Backdrop } from './Backdrop'
import { BottomLine, Decor, Header, UpButton } from './Chrome'
import { Constellation } from './Constellation'
import { InfoPanel } from './InfoPanel'
import { IntroText, NextButton } from './Intro'
import { computeLayout, normalizePointer, type Layout } from './layout'
import { Orbits } from './Orbits'
import { SceneContext, type Scene, type Step } from './scene'

export function Stage() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const layout = useRef<Layout>({ s: 1, w: 1920, top: 0 })
  const lockedAt = useRef(0)

  const [step, setStep] = useState<Step>(0)
  const [visits, setVisits] = useState(0)
  const [hover, setHover] = useState<AnchorId | null>(null)
  const [sel, setSel] = useState<AnchorId | null>(null)

  const camera = useCamera(step === 1)

  // 배율·너비·세로 위치는 React 상태가 아니라 CSS 변수로 바로 넣는다.
  // 그래야 리사이즈 때 장면이 다시 그려지지 않아, 진행 중인 전환 애니메이션이 튀지 않는다.
  useLayoutEffect(() => {
    const el = viewportRef.current!
    const apply = () => {
      const l = computeLayout(window.innerWidth, window.innerHeight)
      layout.current = l
      el.style.setProperty('--s', String(l.s))
      el.style.setProperty('--w', String(l.w))
      el.style.setProperty('--top', `${l.top}px`)
      el.style.setProperty('--top-u', String(l.top / l.s))
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  // 탭이 숨겨지면 CSS 애니메이션(공전·깜빡임·먼지 등)도 멈춘다. (Motion 의 루프는 브라우저가 rAF 를 멈추면서 같이 멈춘다)
  useEffect(() => {
    const el = viewportRef.current!
    const apply = () => el.classList.toggle('is-hidden', document.hidden)
    apply()
    document.addEventListener('visibilitychange', apply)
    return () => document.removeEventListener('visibilitychange', apply)
  }, [])

  // 휠 한 번에 전환 시퀀스 하나. 전환이 끝날 때까지는 다음 입력을 무시한다.
  const go = useCallback(
    (next: Step) => {
      const now = Date.now()
      if (now - lockedAt.current < LOCK_MS || step === next) return
      lockedAt.current = now
      setStep(next)
      setHover(null)
      setSel(null)
      if (next === 1) setVisits((v) => v + 1)
    },
    [step],
  )

  const toggle = useCallback((a: AnchorId) => setSel((cur) => (cur === a ? null : a)), [])

  const scene = useMemo<Scene>(
    () => ({ step, visits, hover, sel, camera, setHover, toggle, go }),
    [step, visits, hover, sel, camera, toggle, go],
  )

  return (
    <SceneContext.Provider value={scene}>
      <div
        ref={viewportRef}
        className="viewport"
        onWheel={(e) => {
          if (e.deltaY > 15) go(1)
          else if (e.deltaY < -15) go(0)
        }}
        onMouseMove={(e) => {
          // DOM 을 읽지 않는다(getBoundingClientRect 는 스타일이 바뀐 직후면 강제로 레이아웃을 돌린다).
          // 무대는 왼쪽 위가 (0, top) 이고 배율이 s 이므로 좌표는 계산으로 구한다.
          const { s, w, top } = layout.current
          const { x, y } = normalizePointer(e.clientX / s, (e.clientY - top) / s, w)
          camera.move(x, y)
        }}
        onMouseLeave={camera.leave}
      >
        <Backdrop />
        <div className="stage">
          {/* 중앙 기준: 원 중심 x = W/2 − 160. 안의 좌표는 1920 폭 프로토타입 그대로다 */}
          <div className="center">
            <Orbits />
            <IntroText />
            <Constellation />
            <InfoPanel />
            <Decor />
          </div>
          {/* 가장자리·가운데 기준 */}
          <Header />
          <NextButton />
          <UpButton />
          <BottomLine />
        </div>
      </div>
    </SceneContext.Provider>
  )
}
