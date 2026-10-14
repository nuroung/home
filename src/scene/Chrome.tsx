import { motion } from 'motion/react'
import { panelFade } from '../motion/targets'
import { useScene } from './scene'

// 헤더, 메뉴 버튼, 위 화살표, 장식 별, 아래 선

export function Header() {
  return (
    <>
      <div style={{ position: 'absolute', left: 64, top: 48, display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontSize: 16,
            letterSpacing: '0.3em',
            color: '#e9e6f2',
          }}
        >
          浮遊船
        </span>
      </div>
      <button
        type="button"
        aria-label="메뉴"
        style={{
          position: 'absolute',
          right: 48,
          top: 30,
          width: 48,
          height: 48,
          padding: 0,
          background: 'none',
          border: 0,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
        }}
      >
        <span aria-hidden style={{ display: 'block', width: 22, height: 1, background: '#e9e6f2' }} />
        <span aria-hidden style={{ display: 'block', width: 22, height: 1, background: '#e9e6f2' }} />
      </button>
    </>
  )
}

export function UpButton() {
  const { step, go } = useScene()
  return (
    <motion.button
      type="button"
      aria-label="처음으로 올라가기"
      onClick={() => go(0)}
      initial={false}
      animate={step === 1 ? panelFade.b : panelFade.a}
      style={{
        position: 'absolute',
        left: '50%',
        marginLeft: -24,
        top: 92,
        width: 48,
        height: 48,
        background: 'none',
        border: 0,
        cursor: 'pointer',
        pointerEvents: step === 1 ? 'auto' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'bobUp 3.2s ease-in-out infinite',
      }}
    >
      <svg aria-hidden width="18" height="10" viewBox="0 0 22 12">
        <path d="M1 11L11 1L21 11" fill="none" stroke="#e9e6f2" strokeWidth="1" />
      </svg>
    </motion.button>
  )
}

export function Decor() {
  return (
    <>
      <svg
        aria-hidden
        width="18"
        height="18"
        viewBox="0 0 24 24"
        style={{ position: 'absolute', left: 470, top: 300, animation: 'twinkle 4s ease-in-out infinite' }}
      >
        <circle cx="12" cy="12" r="2.2" fill="#e9e6f2" />
        <circle cx="12" cy="12" r="8" fill="none" stroke="#e9e6f2" strokeWidth="0.8" opacity="0.55" />
      </svg>
      <svg
        aria-hidden
        width="14"
        height="14"
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          left: 1560,
          top: 790,
          animation: 'twinkle 6s ease-in-out 2s infinite, spin 60s linear infinite',
        }}
      >
        <path d="M12 3V21M3 12H21" stroke="#e9e6f2" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    </>
  )
}

/** 가장자리 기준: 좌우 64 여백을 유지한 아래 선 */
export function BottomLine() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        top: 1045,
        height: 1,
        background:
          'linear-gradient(90deg, rgba(233,230,242,0), rgba(233,230,242,0.4) 20%, rgba(233,230,242,0.4) 80%, rgba(233,230,242,0))',
      }}
    />
  )
}
