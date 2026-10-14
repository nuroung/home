import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { parse } from 'yaml'
import { ANCHORS } from '../src/data/anchors.ts'
import {
  authorsSchema,
  worldSchema,
  type AuthorFonts,
  type Paragraph,
  type World,
} from '../src/data/worldSchema.ts'

// content/worlds/*.yaml 과 content/authors.yaml 을 읽고 검증해서 `virtual:worlds` 로 내보낸다.
// 오류가 있으면 dev 에서는 에러 오버레이로, build 에서는 빌드 실패로 드러난다.

const VIRTUAL_ID = 'virtual:worlds'
const RESOLVED_ID = '\0' + VIRTUAL_ID
const CONTENT_DIR = 'content'
const WORLDS_DIR = `${CONTENT_DIR}/worlds`
const AUTHORS_FILE = `${CONTENT_DIR}/authors.yaml`

interface Loaded {
  worlds: World[]
  authors: AuthorFonts
  errors: string[]
}

function readYaml(file: string, rel: string, errors: string[]): { ok: boolean; value?: unknown } {
  try {
    return { ok: true, value: parse(fs.readFileSync(file, 'utf8')) }
  } catch (e) {
    const msg = (e as Error).message.split('\n')[0]
    // 자주 하는 실수에는 해결책을 붙여 준다
    const hint = /reserved character|Plain value|Nested mappings|Implicit map keys/.test(msg)
      ? ' → @ ` % ! & * | > 로 시작하거나 ": " · " #" 이 들어간 값은 "따옴표"로 감싸고, "- 필자: |" 처럼 ":" 뒤에는 공백을 넣으세요'
      : ''
    errors.push(`${rel} — YAML 문법 오류: ${msg}${hint}`)
    return { ok: false }
  }
}

function loadAuthors(root: string, errors: string[]): AuthorFonts {
  const file = path.resolve(root, AUTHORS_FILE)
  if (!fs.existsSync(file)) return {}

  const yaml = readYaml(file, AUTHORS_FILE, errors)
  if (!yaml.ok) return {}

  const result = authorsSchema.safeParse(yaml.value ?? {})
  if (!result.success) {
    for (const issue of result.error.issues) {
      const item = issue.path.join('.') || '(파일 전체)'
      const missing = /undefined/.test(issue.message)
      errors.push(`${AUTHORS_FILE} — ${item}: ${missing ? '필수 항목이 없습니다' : issue.message}`)
    }
    return {}
  }
  return Object.fromEntries(Object.entries(result.data).map(([key, a]) => [key, { font: a.font }]))
}

function loadWorlds(root: string): Loaded {
  const errors: string[] = []
  const authors = loadAuthors(root, errors)

  const dir = path.resolve(root, WORLDS_DIR)
  const names = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((n) => /\.ya?ml$/i.test(n) && !n.startsWith('_'))
        .sort()
    : []

  const worlds: World[] = []
  const anchorOwner = new Map<string, string>()

  for (const name of names) {
    const rel = `${WORLDS_DIR}/${name}`
    const fail = (item: string, msg: string) => errors.push(`${rel} — ${item}: ${msg}`)

    const yaml = readYaml(path.join(dir, name), rel, errors)
    if (!yaml.ok) continue
    const raw = yaml.value

    let ok = true

    // 1) 형식: 필수 항목·타입·오타. 틀려도 아래 id/anchor 검사는 가능한 만큼 이어서 해서 한 번에 다 보여 준다.
    const result = worldSchema.safeParse(raw)
    if (!result.success) {
      ok = false
      for (const issue of result.error.issues) {
        if (issue.code === 'unrecognized_keys') {
          fail(issue.keys.join(', '), '알 수 없는 항목입니다 (오타인지 확인하세요)')
          continue
        }
        // content 는 "글 하나" 또는 "필자별 문단 목록" 중 하나여야 해서, 어긋나면 zod 가 "Invalid input" 만 알려 준다.
        // 어디가 틀렸는지 직접 찾아 알려 준다.
        if (issue.path[0] === 'content' && issue.code === 'invalid_union') {
          const c = (raw as Record<string, unknown> | null)?.content
          if (Array.isArray(c)) {
            const bad = c.map((p, i) => ({ p, i })).filter(({ p }) => !p || typeof p !== 'object' || Array.isArray(p))
            if (bad.length) {
              for (const { p, i } of bad) {
                fail(
                  `content[${i}]`,
                  `"${String(p).slice(0, 30)}" 은(는) '필자키: 글' 형태가 아닙니다. ':' 뒤에 공백이 있는지 확인하세요 (예: "- r: |", "- r:|" 는 안 됩니다)`,
                )
              }
              continue
            }
          }
          fail(
            'content',
            "글 하나(content: |)이거나, '- 필자키: 글' 문단 목록이어야 합니다. 들여쓰기와 ':' 뒤 공백을 확인하세요",
          )
          continue
        }
        const item = issue.path.join('.') || '(파일 전체)'
        const missing = /undefined/.test(issue.message)
        fail(item, missing ? '필수 항목이 없습니다' : issue.message)
      }
    }

    const fields = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

    // 2) id 는 파일 이름과 같아야 한다
    const expectedId = name.replace(/\.ya?ml$/i, '')
    if (typeof fields.id === 'string' && fields.id !== expectedId) {
      fail('id', `파일 이름과 같아야 합니다 ("${expectedId}" 이어야 하는데 "${fields.id}")`)
      ok = false
    }

    // 3) anchor 는 있는 자리여야 하고, 다른 파일과 겹치면 안 된다
    if (typeof fields.anchor === 'string') {
      if (!(ANCHORS as string[]).includes(fields.anchor)) {
        fail('anchor', `"${fields.anchor}" 은(는) 없는 자리입니다. 사용할 수 있는 anchor: ${ANCHORS.join(', ')}`)
        ok = false
      } else if (anchorOwner.has(fields.anchor)) {
        fail('anchor', `"${fields.anchor}" 이(가) ${anchorOwner.get(fields.anchor)} 와(과) 중복됩니다`)
        ok = false
      } else {
        anchorOwner.set(fields.anchor, name)
      }
    }

    // 4) content: 글 하나(공용 글꼴) 또는 필자별 문단 목록. 필자 키는 authors.yaml 에 있어야 한다
    //    (형식 오류가 있어도 필자 키 검사는 원본에서 직접 해서 한 번에 다 보여 준다)
    const known = Object.keys(authors)
    if (Array.isArray(fields.content)) {
      fields.content.forEach((p, i) => {
        if (!p || typeof p !== 'object') return
        for (const by of Object.keys(p)) {
          if (known.includes(by)) continue
          fail(
            `content[${i}]`,
            `"${by}" 은(는) 없는 필자입니다. ${known.length ? `사용할 수 있는 필자: ${known.join(', ')}` : `${AUTHORS_FILE} 에 필자를 먼저 적어 주세요`}`,
          )
          ok = false
        }
      })
    }

    if (ok && result.success) {
      const c = result.data.content
      const content: Paragraph[] =
        typeof c === 'string'
          ? [{ by: null, text: c.trim() }]
          : c.map((p) => {
              const [by, text] = Object.entries(p)[0]
              return { by, text: text.trim() }
            })
      worlds.push({ ...result.data, content })
    }
  }

  return { worlds, authors, errors }
}

export function worldsPlugin(): Plugin {
  let root = process.cwd()

  return {
    name: 'worlds-yaml',

    configResolved(config) {
      root = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      // 변경 감시는 configureServer 의 watcher 가 맡는다 (addWatchFile 은 dev 에서 import 로 취급돼 쓰지 않는다)
      const { worlds, authors, errors } = loadWorlds(root)
      if (errors.length) {
        this.error(`세계 정보(${CONTENT_DIR}/)에 오류가 있습니다.\n\n${errors.map((e) => `  · ${e}`).join('\n')}\n`)
      }
      return `export const worlds = ${JSON.stringify(worlds)}\nexport const authors = ${JSON.stringify(authors)}`
    },

    configureServer(server) {
      const dir = path.resolve(root, CONTENT_DIR)
      server.watcher.add(dir)
      const onChange = (file: string) => {
        if (!path.resolve(file).startsWith(dir + path.sep)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', onChange).on('change', onChange).on('unlink', onChange)
    },
  }
}
