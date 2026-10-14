import { z } from 'zod'

const text = z.string().min(1, '비어 있을 수 없습니다')

/** content 한 문단: { a: "글" } 처럼 필자 키 하나에 글 하나 */
const authoredParagraph = z.record(z.string(), text).refine((o) => Object.keys(o).length === 1, {
  message: '문단 하나에는 필자 키 하나만 쓸 수 있습니다 (예: - a: 글)',
})

/**
 * content/worlds/<id>.yaml 한 파일의 형식.
 * content 는 글 하나(문자열, 공용 글꼴)이거나, 필자별 문단 목록이다.
 */
export const worldSchema = z
  .object({
    id: text,
    anchor: text,
    label: text,
    eyebrow: text,
    title: text,
    verdict: text,
    content: z.union([text, z.array(authoredParagraph).min(1, '문단이 하나 이상 있어야 합니다')]),
  })
  .strict()

/** 화면에서 쓰는 문단. by 가 null 이면 공용 글꼴 */
export interface Paragraph {
  by: string | null
  text: string
}

export type World = Omit<z.infer<typeof worldSchema>, 'content'> & { content: Paragraph[] }

/** content/authors.yaml */
export const authorsSchema = z.record(
  z.string().regex(/^[a-z0-9_-]+$/i, '키는 영문·숫자·_·- 만 쓸 수 있습니다'),
  z
    .object({
      name: text,
      font: z.string().regex(/^body-[a-z0-9-]+$/, 'body-r 처럼 "body-" 로 시작해야 합니다'),
    })
    .strict(),
)

export type Authors = z.infer<typeof authorsSchema>

/** 화면에 내보내는 필자 정보. 이름은 화면에 쓰지 않으므로 번들에 넣지 않는다. */
export type AuthorFonts = Record<string, { font: string }>
