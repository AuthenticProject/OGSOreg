import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  Check,
  Filter,
  Layers,
  Sparkles,
  Award,
  Medal,
  Info,
} from 'lucide-react'
import { KAMPUS_OPTIONS } from '../../types/campus'
import { hallOfFameService, campusToSlug } from '../../services/hallOfFameService'
import { cn } from '../../lib/utils'

interface HallOfFameTrendsTabProps {
  initialCampus?: string
  onSelectCampus: (campusSlug: string) => void
}

type MetricMode = 'points' | 'awards' | 'medals'

const CAMPUS_PALETTE = [
  '#166534', // Primary Emerald
  '#0284C7', // Vivid Sky Blue
  '#D97706', // Vibrant Amber
  '#7C3AED', // Vivid Violet
  '#DC2626', // Crimson Red
  '#0D9488', // Deep Teal
  '#E11D48', // Rose Pink
  '#2563EB', // Royal Blue
  '#4F46E5', // Indigo
  '#059669', // Mint Emerald
  '#B45309', // Dark Ochre
  '#9333EA', // Bright Purple
  '#C026D3', // Fuchsia
  '#EA580C', // Deep Orange
  '#0891B2', // Cyan
  '#65A30D', // Lime Green
  '#475569', // Slate
  '#BE185D', // Dark Pink
  '#854D0E', // Bronze Brown
  '#0F172A', // Midnight Navy
]

// Smooth cubic Bézier path generator
function getCurvedPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export const HallOfFameTrendsTab: React.FC<HallOfFameTrendsTabProps> = ({
  initialCampus = 'Gontor 1',
  onSelectCampus,
}) => {
  const [selectedCampuses, setSelectedCampuses] = useState<string[]>([
    initialCampus,
    'Gontor 2',
    'Gontor Putri 1',
  ])
  const [metricMode, setMetricMode] = useState<MetricMode>('points')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [hoveredPoint, setHoveredPoint] = useState<{
    campus: string
    year: number
    value: number
    periodName: string
    gold: number
    silver: number
    bronze: number
    hm1: number
    hm2: number
    totalAwards: number
    rank: number
    x: number
    y: number
  } | null>(null)

  // Compute trend series from service (0-winner periods already excluded)
  const trendData = useMemo(() => {
    return hallOfFameService.computeHistoricalTrends(selectedCampuses, levelFilter)
  }, [selectedCampuses, levelFilter])

  const { periods, series } = trendData

  // Toggle campus selection (no arbitrary limit, can select all campuses)
  const toggleCampus = (campus: string) => {
    if (selectedCampuses.includes(campus)) {
      if (selectedCampuses.length === 1) return // keep at least 1
      setSelectedCampuses((prev) => prev.filter((c) => c !== campus))
    } else {
      setSelectedCampuses((prev) => [...prev, campus])
    }
  }

  const handleSelectAll = () => {
    setSelectedCampuses([...KAMPUS_OPTIONS])
  }

  const handleResetTop3 = () => {
    setSelectedCampuses([initialCampus, 'Gontor 2', 'Gontor Putri 1'])
  }

  // Find max value for Y-axis scale
  const maxYValue = useMemo(() => {
    let max = 5
    for (const s of series) {
      for (const d of s.data) {
        let val = d.points
        if (metricMode === 'awards') val = d.totalAwards
        else if (metricMode === 'medals') val = d.gold + d.silver + d.bronze
        if (val > max) max = val
      }
    }
    return Math.max(5, Math.ceil(max * 1.2))
  }, [series, metricMode])

  // Chart SVG coordinates
  const svgWidth = 840
  const svgHeight = 360
  const paddingLeft = 60
  const paddingRight = 40
  const paddingTop = 40
  const paddingBottom = 50
  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  const getX = (index: number) => {
    if (periods.length <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index / (periods.length - 1)) * chartWidth
  }

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxYValue) * chartHeight
  }

  const metricLabel =
    metricMode === 'points'
      ? 'Skor Poin'
      : metricMode === 'awards'
      ? 'Total Penghargaan'
      : 'Medali (1–3)'

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Controls Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#166534]">
              <TrendingUp className="w-3.5 h-3.5 text-[#166534]" />
              <span>Analisis Komparatif Performa Multitahun</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0C241B] tracking-tight">
              Lintasan Prestasi Lintas Periode
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Memvisualisasikan dinamika kenaikan skor dan perolehan penghargaan kontingen. Periode tanpa pemenang (0 juara) otomatis dieksklusi dari kurva analitik.
            </p>
          </div>

          {/* Metric Selector Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => setMetricMode('points')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  metricMode === 'points'
                    ? 'bg-gradient-to-r from-[#166534] to-[#15803D] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Skor Poin</span>
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('awards')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  metricMode === 'awards'
                    ? 'bg-gradient-to-r from-[#166534] to-[#15803D] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Total Juara</span>
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('medals')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  metricMode === 'medals'
                    ? 'bg-gradient-to-r from-[#166534] to-[#15803D] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Medal className="w-3.5 h-3.5" />
                <span>Medali (1-3)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row & Active Campuses Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-[#166534]" />
              <span>Jenjang:</span>
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F5F8F4] border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#166534] shadow-2xs"
            >
              <option value="all">Semua Jenjang (Akumulatif)</option>
              <option value="Jenjang 1">Jenjang 1</option>
              <option value="Jenjang 2">Jenjang 2</option>
              <option value="Jenjang 3">Jenjang 3</option>
              <option value="Jenjang 4">Jenjang 4</option>
              <option value="Jenjang 5">Jenjang 5</option>
              <option value="Shigor">Shigor (1-2)</option>
              <option value="Kibar">Kibar (3-4)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <span>Kontingen Terpilih:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#166534] font-bold">
              {selectedCampuses.length === KAMPUS_OPTIONS.length
                ? `Semua Kampus (${selectedCampuses.length}/${KAMPUS_OPTIONS.length})`
                : `${selectedCampuses.length} / ${KAMPUS_OPTIONS.length} Kampus`}
            </span>
          </div>
        </div>

        {/* Campus Chips Multi-Selector */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span>Pilih Kontingen Kampus Pembanding:</span>
              <span className="text-[10px] lowercase text-slate-400 font-normal">
                (bisa pilih semua kampus)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-[#166534] border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Pilih Semua ({KAMPUS_OPTIONS.length})
              </button>
              <button
                type="button"
                onClick={handleResetTop3}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Reset (Top 3)
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {KAMPUS_OPTIONS.map((c) => {
              const isSelected = selectedCampuses.includes(c)
              const idx = selectedCampuses.indexOf(c)
              const color = isSelected ? CAMPUS_PALETTE[idx % CAMPUS_PALETTE.length] : undefined

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCampus(c)}
                  style={{
                    backgroundColor: isSelected ? color : undefined,
                    borderColor: isSelected ? color : undefined,
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs',
                    isSelected
                      ? 'text-white shadow-sm ring-2 ring-offset-1 ring-emerald-600/30'
                      : 'bg-[#F9FAF8] border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-white'
                  )}
                >
                  {isSelected ? (
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                  <span>{c}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Trend Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-[#166534] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0C241B] uppercase tracking-wider">
                Kurva Prestasi Komparatif ({metricLabel})
              </h3>
              <p className="text-[11px] text-slate-400">
                Data ditarik secara eksklusif dari periode yang telah memublikasikan pemenang resmi
              </p>
            </div>
          </div>

          {/* Dynamic Campus Legend */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedCampuses.map((c, i) => {
              const color = CAMPUS_PALETTE[i % CAMPUS_PALETTE.length]
              return (
                <div
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-xs font-bold text-slate-700"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-xs"
                    style={{ backgroundColor: color }}
                  />
                  <span>{c}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* SVG Canvas Container */}
        {periods.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#FBFDFB] border border-dashed border-emerald-300/80 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center">
              <Layers className="w-6 h-6 opacity-70" />
            </div>
            <h4 className="text-sm font-extrabold text-[#0C241B]">
              Belum Ada Periode Dengan Data Pemenang
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Grafik lintasan historis mengecualikan periode dengan 0 juara. Grafik akan otomatis terpetakan saat hasil resmi dipublikasikan pada periode terkait.
            </p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-h-[300px] max-h-[420px] select-none"
            >
              {/* Defs for Linear Gradients under curves */}
              <defs>
                {selectedCampuses.map((c, i) => {
                  const color = CAMPUS_PALETTE[i % CAMPUS_PALETTE.length]
                  return (
                    <linearGradient
                      key={`grad-${c}`}
                      id={`fill-grad-${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                  )
                })}
              </defs>

              {/* Horizontal Grid Lines & Y-Ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingTop + chartHeight * (1 - pct)
                const val = Math.round(maxYValue * pct)
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke={pct === 0 ? '#94A3B8' : '#E2E8F0'}
                      strokeDasharray={pct === 0 ? undefined : '4 4'}
                      strokeWidth={pct === 0 ? 1.5 : 1}
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#64748B"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                )
              })}

              {/* X-Axis Period Tick Lines & Labels */}
              {periods.map((p, i) => {
                const x = getX(i)
                return (
                  <g key={p.id}>
                    <line
                      x1={x}
                      y1={paddingTop + chartHeight}
                      x2={x}
                      y2={paddingTop + chartHeight + 8}
                      stroke="#64748B"
                      strokeWidth="1.5"
                    />
                    <text
                      x={x}
                      y={paddingTop + chartHeight + 22}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="800"
                      fill="#0C241B"
                    >
                      {p.name}
                    </text>
                    <text
                      x={x}
                      y={paddingTop + chartHeight + 36}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#64748B"
                    >
                      Tahun {p.year}
                    </text>
                  </g>
                )
              })}

              {/* Render Smooth Cubic Curves & Area Fills */}
              {series.map((s, seriesIdx) => {
                const color = CAMPUS_PALETTE[seriesIdx % CAMPUS_PALETTE.length]
                const coords = s.data.map((d, i) => {
                  let val = d.points
                  if (metricMode === 'awards') val = d.totalAwards
                  else if (metricMode === 'medals') val = d.gold + d.silver + d.bronze
                  return { x: getX(i), y: getY(val), val, raw: d }
                })

                const curvePath = getCurvedPath(coords)
                const areaPath =
                  coords.length >= 2
                    ? `${curvePath} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`
                    : ''

                return (
                  <g key={s.campus}>
                    {/* Area fill under curve */}
                    {areaPath && (
                      <path
                        d={areaPath}
                        fill={`url(#fill-grad-${seriesIdx})`}
                        className="transition-opacity duration-300 pointer-events-none"
                      />
                    )}

                    {/* Smooth Stroke Line */}
                    <path
                      d={curvePath}
                      fill="none"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-300 drop-shadow-xs"
                    />

                    {/* Glowing Interactive Data Points */}
                    {coords.map((pt, i) => {
                      const isHovered =
                        hoveredPoint?.campus === s.campus && hoveredPoint?.year === pt.raw.year

                      return (
                        <g key={i}>
                          {/* Hover Halo Ring */}
                          {isHovered && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="12"
                              fill={color}
                              fillOpacity="0.25"
                              className="animate-pulse"
                            />
                          )}

                          {/* Outer Circle */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 7 : 5}
                            fill="#FFFFFF"
                            stroke={color}
                            strokeWidth={isHovered ? 3.5 : 2.5}
                            className="cursor-pointer transition-all duration-200"
                            onMouseEnter={() =>
                              setHoveredPoint({
                                campus: s.campus,
                                year: pt.raw.year,
                                periodName: pt.raw.periodName,
                                value: pt.val,
                                gold: pt.raw.gold,
                                silver: pt.raw.silver,
                                bronze: pt.raw.bronze,
                                hm1: pt.raw.hm1,
                                hm2: pt.raw.hm2,
                                totalAwards: pt.raw.totalAwards,
                                rank: pt.raw.rank,
                                x: pt.x,
                                y: pt.y,
                              })
                            }
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        </g>
                      )
                    })}
                  </g>
                )
              })}
            </svg>

            {/* Dynamic Glassmorphic Floating Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute p-4 rounded-2xl bg-[#071C14]/95 backdrop-blur-md text-white text-xs shadow-2xl border border-emerald-500/40 space-y-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-none z-20 min-w-[200px]"
                style={{
                  top: Math.max(10, hoveredPoint.y - 120),
                  left: Math.min(
                    svgWidth - 220,
                    Math.max(20, hoveredPoint.x - 100)
                  ),
                }}
              >
                <div className="flex items-center justify-between gap-2 border-b border-emerald-800/80 pb-2">
                  <span className="font-extrabold text-[#A7F3D0] text-sm">
                    {hoveredPoint.campus}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900/90 text-[#D5C49A] font-bold text-[10px]">
                    Rank #{hoveredPoint.rank}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300">
                  {hoveredPoint.periodName} ({hoveredPoint.year})
                </div>

                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="font-mono text-2xl font-black text-[#D5C49A]">
                    {hoveredPoint.value}
                  </span>
                  <span className="text-[11px] text-emerald-200 uppercase tracking-wider font-semibold">
                    {metricLabel}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-2 border-t border-emerald-800/80 text-center text-[10px]">
                  <div className="p-1 rounded bg-black/30">
                    <div className="text-amber-400 font-bold">🥇 {hoveredPoint.gold}</div>
                    <div className="text-[9px] text-slate-400">Emas</div>
                  </div>
                  <div className="p-1 rounded bg-black/30">
                    <div className="text-slate-300 font-bold">🥈 {hoveredPoint.silver}</div>
                    <div className="text-[9px] text-slate-400">Perak</div>
                  </div>
                  <div className="p-1 rounded bg-black/30">
                    <div className="text-amber-600 font-bold">🥉 {hoveredPoint.bronze}</div>
                    <div className="text-[9px] text-slate-400">Prg</div>
                  </div>
                  <div className="p-1 rounded bg-black/30">
                    <div className="text-emerald-300 font-bold">
                      {hoveredPoint.hm1 + hoveredPoint.hm2}
                    </div>
                    <div className="text-[9px] text-slate-400">Harapan</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Detailed Performance Progression Matrix Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#0C241B] uppercase tracking-wider">
              Matriks Rekapitulasi Prestasi Lintas Periode
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian capaian poin dan jumlah penghargaan kontingen terpilih pada setiap periode resmi
            </p>
          </div>
          <span className="text-xs font-bold text-[#166534] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {periods.length} Periode Terdata
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Kontingen Kampus</th>
                {periods.map((p) => (
                  <th key={p.id} className="py-3.5 px-4 text-center">
                    <div>{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">Tahun {p.year}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {series.map((s, seriesIdx) => {
                const color = CAMPUS_PALETTE[seriesIdx % CAMPUS_PALETTE.length]
                return (
                  <tr key={s.campus} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0C241B]">
                      <button
                        onClick={() => onSelectCampus(campusToSlug(s.campus))}
                        className="cursor-pointer hover:underline hover:text-[#166534] text-left flex items-center gap-2"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span>{s.campus}</span>
                      </button>
                    </td>
                    {s.data.map((d) => (
                      <td key={d.periodId} className="py-3.5 px-4 text-center">
                        <div className="font-extrabold text-[#166534] font-mono text-sm">
                          {d.points} Poin
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {d.totalAwards > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <span>🏆 {d.totalAwards} Juara</span>
                              {d.gold > 0 && <span className="text-amber-600">({d.gold}🥇)</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400">0 Juara</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Methodology Note */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-slate-700 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-[#0C241B]">Validitas & Standar Grafik Analitik</div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Grafik ini menerapkan kurva smooth Bézier yang secara ketat hanya menyajikan periode-periode berstatus terbit yang memiliki perolehan juara valid (&gt; 0 pemenang). Periode yang belum atau tidak mencatatkan pemenang tidak dimunculkan untuk menjaga integritas komparasi visual.
          </p>
        </div>
      </div>
    </div>
  )
}
