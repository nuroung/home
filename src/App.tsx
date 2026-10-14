import { DesktopOnly, useDesktopOnly } from './DesktopOnly'
import { Stage } from './scene/Stage'

export default function App() {
  const blocked = useDesktopOnly()
  return blocked ? <DesktopOnly /> : <Stage />
}
