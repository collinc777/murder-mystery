import { Snow } from './Snow'
import { HostIndicator } from './HostIndicator'

interface LayoutProps {
  children: React.ReactNode
  isHost?: boolean
}

export function Layout({ children, isHost = false }: LayoutProps) {
  return (
    <div>
      <Snow />
      {isHost && <HostIndicator />}
      {children}
    </div>
  )
} 