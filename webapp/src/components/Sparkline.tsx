'use client'

export function Sparkline({ data, color = '#5D7052', strokeWidth = 2 }: { data: number[], color?: string, strokeWidth?: number }) {
  if (!data || data.length < 2) return null
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = (max - min) || 1
  
  const width = 100
  const height = 40
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return { x, y }
  })

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaData = `${pathData} L${width},${height} L0,${height} Z`
  
  const gradientId = `gradient-${color.replace('#', '')}`

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area Fill */}
      <path
        d={areaData}
        fill={`url(#${gradientId})`}
        className="transition-all duration-700 ease-in-out"
      />
      
      {/* Line Stroke */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-700 ease-in-out"
      />
    </svg>
  )
}
