interface StatCardProps {
  icon: string
  label: string
  value: string
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-label">
        {icon} {label}
      </span>
      <strong className="stat-value">{value}</strong>
    </div>
  )
}
