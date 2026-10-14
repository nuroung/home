import { authors, worlds } from 'virtual:worlds'
import type { AnchorId } from './anchors'
import type { World } from './worldSchema'

/** anchor → 세계. YAML이 없는 자리는 들어 있지 않다. */
export const worldByAnchor = new Map<string, World>(worlds.map((w) => [w.anchor, w]))

export const worldAt = (anchor: AnchorId): World | undefined => worldByAnchor.get(anchor)

/** 필자 키 → 글꼴 묶음 이름(body-r …). 필자 이름은 화면에 쓰지 않는다. */
export const authorFont = (by: string | null): string | null => (by ? (authors[by]?.font ?? null) : null)
