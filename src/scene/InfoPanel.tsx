import { motion } from 'motion/react'
import { authorFont, worldAt } from '../data/worlds'
import { TYPE_GAP, TYPE_START, TYPE_STEP } from '../motion/interaction'
import { panelFade } from '../motion/targets'
import { useScene } from './scene'
import { useWorldFontsReady } from './useWorldFonts'

// 오른쪽 정보 패널. 호버한 대상이 우선이고, 커서가 벗어나면 선택한 대상으로 돌아간다.

function Typed({ text, start }: { text: string; start: number }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i} style={{ animation: `typeIn .01s linear ${(start + i * TYPE_STEP).toFixed(3)}s both` }}>
          {ch}
        </span>
      ))}
    </>
  )
}

const len = (s: string) => Array.from(s).length

/** 본문 문단의 글꼴: 필자가 있으면 tokens.css 의 --font-<font>* 변수, 없으면 공용 글꼴 */
function bodyStyle(by: string | null): React.CSSProperties {
  const font = authorFont(by)
  if (!font) {
    return { fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 18, color: 'rgba(233,230,242,0.85)' }
  }
  return {
    fontFamily: `var(--font-${font})`,
    fontWeight: `var(--font-${font}-weight)`,
    fontSize: `var(--font-${font}-size)`,
    lineHeight: `var(--font-${font}-line)`,
    color: 'rgba(233,230,242,0.85)',
  }
}

export function InfoPanel() {
  const { step, hover, sel, camera } = useScene()
  const id = hover ?? sel
  const world = id ? worldAt(id) : undefined
  const fontsReady = useWorldFontsReady(world)

  // 제목 → 판단 결과 → 문단들 순으로 이어서 타이핑
  const verdictAt = world ? len(world.title) * TYPE_STEP + TYPE_GAP : 0
  let cursor = world ? verdictAt + len(world.verdict) * TYPE_STEP + TYPE_GAP : 0
  const paragraphs =
    world?.content.map((p) => {
      const start = cursor
      cursor += len(p.text) * TYPE_STEP + TYPE_GAP
      return { ...p, start }
    }) ?? []

  return (
    <motion.div
      initial={false}
      animate={step === 1 ? panelFade.b : panelFade.a}
      style={{
        position: 'absolute',
        left: 1250,
        top: 400,
        width: 440,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        pointerEvents: step === 1 ? 'auto' : 'none',
        x: camera.text.x,
        y: camera.text.y,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {world ? (
        // 글꼴이 준비되기 전에는 아무것도 그리지 않는다 → 타이핑이 준비 뒤에 시작된다
        fontsReady && (
          <div key={world.id} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.42em',
                color: 'rgba(233,230,242,0.5)',
                animation: 'typeFade .4s ease both',
              }}
            >
              {world.eyebrow}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 300,
                fontSize: 44,
                lineHeight: 1.1,
                color: '#f3f1f8',
                whiteSpace: 'pre',
              }}
            >
              <Typed text={world.title} start={TYPE_START} />
            </span>
            <div
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'baseline',
                paddingTop: 18,
                borderTop: '1px solid rgba(233,230,242,0.14)',
              }}
            >
              <span style={{ width: 80, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(233,230,242,0.5)' }}>
                판단 결과
              </span>
              <span style={{ fontSize: 15, color: '#e9e6f2', whiteSpace: 'pre' }}>
                <Typed text={world.verdict} start={verdictAt} />
              </span>
            </div>
            {/* 본문: 문단마다 필자의 글꼴. 줄바꿈은 그대로 두고, 패널 폭을 넘으면 접는다 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ margin: 0, whiteSpace: 'pre-wrap', ...bodyStyle(p.by) }}>
                  <Typed text={p.text} start={p.start} />
                </p>
              ))}
            </div>
          </div>
        )
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif)',
            fontWeight: 300,
            fontSize: 18,
            lineHeight: 1.9,
            letterSpacing: '0.04em',
            color: 'rgba(233,230,242,0.72)',
          }}
        >
          [부유하는 배에 기록된
          <br />
          세계를 열람할 수 있습니다.]
        </p>
      )}
    </motion.div>
  )
}
