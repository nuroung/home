import type { TargetAndTransition } from 'motion/react'
import { A_TO_B, B_TO_A, tr } from './transition'

// 여러 컴포넌트가 같이 쓰는 A/B 상태. 모듈에서 한 번만 만들어
// 렌더마다 같은 객체가 들어가게 한다(새 객체를 넘기면 Motion 이 애니메이션을 다시 시작할 수 있다).

/** 별자리·정보 패널·위 화살표: B 에서 1.4초 뒤 페이드 인, A 로 돌아갈 땐 바로 페이드 아웃 */
export const panelFade = {
  a: { opacity: 0, transition: tr(B_TO_A.panel) },
  b: { opacity: 1, transition: tr(A_TO_B.panel) },
} satisfies Record<'a' | 'b', TargetAndTransition>
