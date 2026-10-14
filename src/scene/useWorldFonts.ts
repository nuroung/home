import { useEffect, useState } from 'react'
import type { World } from '../data/worldSchema'

// 패널의 타이핑 효과는 글꼴이 준비된 뒤에 시작한다. 글꼴이 도중에 바뀌면 글자 폭이 달라져 튀기 때문이다.
// document.fonts.ready 만으로는 부족하다: 글꼴은 화면에 쓰이기 전엔 요청조차 되지 않아
// ready 가 곧바로 끝나 버린다. 그래서 필요한 글꼴을 document.fonts.load 로 먼저 불러 놓고 ready 를 기다린다.

/** 글꼴이 안 불러와질 때(오프라인 등) 패널이 영영 비지 않도록 기다리는 최대 시간 */
const TIMEOUT_MS = 3000

/** 필자 글꼴 (src/styles/fonts.css) */
const AUTHOR_FACES = ['400 18px GriunHangeulDdurae', '400 18px HakgyoansimNadeuri', '400 18px OngeulipGeungjeong']

const loaded = new Set<string>()
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function loadFor(world: World): Promise<void> {
  const body = world.content.map((p) => p.text).join('')
  const jobs = [
    ...AUTHOR_FACES.map((face) => document.fonts.load(face, '가')),
    // 공용 글꼴은 글자 묶음(unicode-range)별로 나뉘어 있어, 이 세계에서 실제로 쓰는 글자로 요청한다
    document.fonts.load('300 44px "Noto Serif KR"', world.title),
    document.fonts.load('300 18px "Noto Serif KR"', body),
    document.fonts.load('400 15px "Noto Sans KR"', `${world.verdict}판단 결과`),
    document.fonts.load('400 11px "IBM Plex Mono"', world.eyebrow),
  ]
  const ready = Promise.allSettled(jobs).then(() => document.fonts.ready)
  return Promise.race([ready, wait(TIMEOUT_MS)]).then(() => undefined)
}

/** 이 세계를 그리는 데 필요한 글꼴이 준비됐는지. 한 번 준비된 세계는 바로 true. */
export function useWorldFontsReady(world: World | undefined): boolean {
  const [, bump] = useState(0)

  useEffect(() => {
    if (!world || loaded.has(world.id)) return
    let live = true
    loadFor(world).then(() => {
      loaded.add(world.id)
      if (live) bump((n) => n + 1)
    })
    return () => {
      live = false
    }
  }, [world])

  return !!world && loaded.has(world.id)
}
