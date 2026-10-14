import { createContext, useContext } from 'react'
import type { AnchorId } from '../data/anchors'
import type { Camera } from '../motion/camera'

export type Step = 0 | 1

export interface Scene {
  /** 0 = A(첫 화면), 1 = B(궤도 화면) */
  step: Step
  /** B 로 들어간 횟수. 공전 keyframes 를 처음부터 다시 돌리는 데 쓴다. */
  visits: number
  hover: AnchorId | null
  sel: AnchorId | null
  camera: Camera
  setHover: (a: AnchorId | null) => void
  /** 같은 대상을 누르면 해제, 다른 대상을 누르면 그 대상으로 바뀐다. */
  toggle: (a: AnchorId) => void
  go: (step: Step) => void
}

export const SceneContext = createContext<Scene | null>(null)

export function useScene(): Scene {
  const scene = useContext(SceneContext)
  if (!scene) throw new Error('SceneContext 밖에서 useScene 을 불렀습니다')
  return scene
}
