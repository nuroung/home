import { motion } from 'motion/react'
import type { TargetAndTransition } from 'motion/react'
import { A_TO_B, B_TO_A, tr } from '../motion/transition'
import { useScene } from './scene'

// A 화면: 錄 / 부유하는 배 / 별똥별 스크롤 안내

const intro = {
  a: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { opacity: tr(B_TO_A.introFade), y: tr(B_TO_A.introMove), filter: tr(B_TO_A.introBlur) },
  },
  b: {
    opacity: 0,
    y: -24,
    filter: 'blur(8px)',
    transition: { opacity: tr(A_TO_B.introFade), y: tr(A_TO_B.introMove), filter: tr(A_TO_B.introBlur) },
  },
} satisfies Record<'a' | 'b', TargetAndTransition>

const nextButton = {
  a: { opacity: 1, transition: tr(B_TO_A.nextButton) },
  b: { opacity: 0, transition: tr(A_TO_B.nextButton) },
} satisfies Record<'a' | 'b', TargetAndTransition>

const RISE = 'cubic-bezier(.2,.7,.2,1)'

/** 중앙 기준 묶음 안: 錄 / 부유하는 배 */
export function IntroText() {
  const { step } = useScene()
  const key = step === 1 ? 'b' : 'a'

  return (
      <motion.div
        initial={false}
        animate={intro[key]}
        style={{
          position: 'absolute',
          left: 1170,
          top: 350,
          width: 640,
          height: 360,
          pointerEvents: step === 1 ? 'none' : 'auto',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 4,
            top: 54,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.42em',
            color: 'rgba(233,230,242,0.5)',
            animation: `rise 1.4s ${RISE} .2s both`,
          }}
        >
          N° 000
        </span>
        <h1
          style={{
            position: 'absolute',
            left: 0,
            top: 86,
            margin: 0,
            fontFamily: 'var(--font-serif)',
            fontWeight: 200,
            fontSize: 140,
            lineHeight: 0.95,
            letterSpacing: '0.02em',
            color: '#f3f1f8',
            animation: `rise 1.6s ${RISE} .35s both`,
          }}
        >
          錄
        </h1>
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 252,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            fontFamily: 'var(--font-serif)',
            fontWeight: 300,
            fontSize: 20,
            lineHeight: 1.8,
            letterSpacing: '0.03em',
            color: 'rgba(233,230,242,0.74)',
            animation: 'driftA 7s ease-in-out infinite',
          }}
        >
          <span style={{ display: 'block', animation: `rise 1.6s ${RISE} .45s both` }}>부유하는 배</span>
        </div>
      </motion.div>
  )
}

/** 하단 중앙: 별똥별 스크롤 안내 */
export function NextButton() {
  const { step, go } = useScene()
  const key = step === 1 ? 'b' : 'a'

  return (
      <motion.button
        type="button"
        aria-label="다음 화면으로 흘러 내려가기"
        onClick={() => go(1)}
        initial={false}
        animate={nextButton[key]}
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: -60,
          top: 900,
          width: 120,
          height: 120,
          padding: 0,
          background: 'none',
          border: 0,
          cursor: 'pointer',
          pointerEvents: step === 1 ? 'none' : 'auto',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 30,
            top: 0,
            width: 60,
            height: 116,
            transform: 'rotate(-26deg)',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 29,
              top: 0,
              width: 1.5,
              height: 48,
              borderRadius: 1,
              background: 'linear-gradient(to bottom, rgba(233,230,242,0), rgba(255,255,255,0.95))',
              boxShadow: '0 2px 8px rgba(255,255,255,0.55)',
              animation: 'meteor 3s cubic-bezier(.45,0,.2,1) infinite',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: 10,
              width: 1,
              height: 28,
              borderRadius: 1,
              background: 'linear-gradient(to bottom, rgba(233,230,242,0), rgba(255,255,255,0.6))',
              animation: 'meteor 3s cubic-bezier(.45,0,.2,1) 1.5s infinite',
            }}
          />
        </span>
      </motion.button>
  )
}
