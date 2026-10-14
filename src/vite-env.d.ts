/// <reference types="vite/client" />

declare module 'virtual:worlds' {
  import type { AuthorFonts, World } from './data/worldSchema'
  export const worlds: World[]
  export const authors: AuthorFonts
}
