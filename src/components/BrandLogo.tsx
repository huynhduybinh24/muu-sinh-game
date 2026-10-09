interface BrandLogoProps {
  variant?: 'horizontal' | 'compact' | 'emblem'
  className?: string
  decorative?: boolean
}

export function BrandLogo({ variant = 'horizontal', className = '', decorative = false }: BrandLogoProps) {
  const dimensions = variant === 'compact' ? [720, 420] : variant === 'emblem' ? [256, 256] : [960, 280]
  return <img className={`brand-logo ${className}`.trim()} src={`/branding/logo-${variant}.svg`}
    width={dimensions[0]} height={dimensions[1]} draggable={false}
    alt={decorative ? '' : variant === 'emblem' ? 'Biểu tượng Mưu Sinh' : 'MƯU SINH — Mỗi Ngày Một Nghề'} />
}
