export type DashboardTab = 'home' | 'career' | 'profile'

interface BottomNavProps {
  active: DashboardTab
  onHome: () => void
  onCareer: () => void
  onProfile: () => void
}

export function BottomNav({ active, onHome, onCareer, onProfile }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'TRANG CHỦ', icon: '⌂', onClick: onHome },
    { id: 'career', label: 'SỰ NGHIỆP', icon: '🏆', onClick: onCareer },
    { id: 'profile', label: 'HỒ SƠ', icon: '☺', onClick: onProfile },
  ] as const
  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" aria-current={active === tab.id ? 'page' : undefined} onClick={tab.onClick}>
          <span aria-hidden="true">{tab.icon}</span>{tab.label}
        </button>
      ))}
    </nav>
  )
}
