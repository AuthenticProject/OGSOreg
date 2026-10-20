import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  Check,
  Filter,
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
  '#0C241B', // Deep Forest
  '#D97706', // Amber
  '#2563EB', // Royal Blue
  '#9333EA', // Purple
  '#DC2626', // Crimson
  '#0D9488', // Teal
]

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
  } | null>(null)

  // Compute trend series from service
  const trendData = useMemo(() => {
    return hallOfFameService.computeHistoricalTrends(selectedCampuses, levelFilter)
  }, [selectedCampuses, levelFilter])

  const { periods, series } = trendData

  // Toggle campus selection
  const toggleCampus = (campus: string) => {
    if (selectedCampuses.includes(campus)) {
      if (selectedCampuses.length === 1) return // keep at least 1
      setSelectedCampuses((prev) => prev.filter((c) => c !== campus))
    } else {
      if (selectedCampuses.length >= 6) return // max 6 for chart readability
      setSelectedCampuses((prev) => [...prev, campus])
    }
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
    return Math.ceil(max * 1.15)
  }, [series, metricMode])

  // Chart SVG coordinates
  const svgWidth = 800
  const svgHeight = 320
  const paddingLeft = 50
  const paddingRight = 30
  const paddingTop = 30
  const paddingBottom = 40
  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  const getX = (index: number) => {
    if (periods.length <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index / (periods.length - 1)) * chartWidth
  }

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxYValue) * chartHeight
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Controls Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#0C241B]">
              Analisis Komparatif Performa Lintas Periode
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih satu atau hingga 6 kontingen kampus untuk membandingkan lintasan prestasi historis.
            </p>
          </div>

          {/* Metric Selector */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <button
              onClick={() => setMetricMode('points')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                metricMode === 'points'
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Skor Poin
            </button>
            <button
              onClick={() => setMetricMode('awards')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                metricMode === 'awards'
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Total Penghargaan
            </button>
            <button
              onClick={() => setMetricMode('medals')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                metricMode === 'medals'
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Medali (1–3)
            </button>
          </div>
        </div>

        {/* Level Filter & Quick Guide */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Filter Jenjang:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F8F4] border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#166534]"
            >
              <option value="all">Semua Jenjang</option>
              <option value="Jenjang 1">Jenjang 1</option>
              <option value="Jenjang 2">Jenjang 2</option>
              <option value="Jenjang 3">Jenjang 3</option>
              <option value="Jenjang 4">Jenjang 4</option>
              <option value="Jenjang 5">Jenjang 5</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500">
            Terpilih: {selectedCampuses.length} dari maks 6 kampus
          </div>
        </div>

        {/* Campus Chips Selector */}
        <div className="space-y-2 pt-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Pilih Kampus Pembanding:
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
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border',
                    isSelected
                      ? 'text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                  <span>{c}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Trend Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#166534]" />
            <h3 className="text-sm font-extrabold text-[#0C241B] uppercase tracking-wider">
              Grafik Lintasan Capaian ({metricMode === 'points' ? 'Skor Poin' : metricMode === 'awards' ? 'Jumlah Penghargaan' : 'Medali'})
            </h3>
          </div>

          {/* Dynamic Legend */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedCampuses.map((c, i) => (
              <div key={c} className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CAMPUS_PALETTE[i % CAMPUS_PALETTE.length] }}
                />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Canvas Container */}
        {periods.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Belum ada arsip periode resmi yang terekam.
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[380px] select-none"
            >
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
                      stroke="#E2E8F0"
                      strokeDasharray={pct === 0 ? undefined : '3 3'}
                      strokeWidth={pct === 0 ? 1.5 : 1}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94A3B8"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                )
              })}

              {/* X-Axis Period Labels */}
              {periods.map((p, i) => {
                const x = getX(i)
                return (
                  <g key={p.id}>
                    <line
                      x1={x}
                      y1={paddingTop + chartHeight}
                      x2={x}
                      y2={paddingTop + chartHeight + 6}
                      stroke="#94A3B8"
                    />
                    <text
                      x={x}
                      y={paddingTop + chartHeight + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#0C241B"
                    >
                      {p.name}
                    </text>
                    <text
                      x={x}
                      y={paddingTop + chartHeight + 32}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94A3B8"
                    >
                      Tahun {p.year}
                    </text>
                  </g>
                )
              })}

              {/* Render Trend Lines */}
              {series.map((s, seriesIdx) => {
                const color = CAMPUS_PALETTE[seriesIdx % CAMPUS_PALETTE.length]
                const pointsStr = s.data
                  .map((d, i) => {
                    let val = d.points
                    if (metricMode === 'awards') val = d.totalAwards
                    else if (metricMode === 'medals') val = d.gold + d.silver + d.bronze
                    return `${getX(i)},${getY(val)}`
                  })
                  .join(' ')

                return (
                  <g key={s.campus}>
                    <polyline
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsStr}
                    />
                    {/* Data Points */}
                    {s.data.map((d, i) => {
                      let val = d.points
                      if (metricMode === 'awards') val = d.totalAwards
                      else if (metricMode === 'medals') val = d.gold + d.silver + d.bronze
                      const cx = getX(i)
                      const cy = getY(val)
                      const isHovered =
                        hoveredPoint?.campus === s.campus && hoveredPoint?.year === d.year

                      return (
                        <circle
                          key={i}
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 6 : 4}
                          fill={isHovered ? '#FFFFFF' : color}
                          stroke={color}
                          strokeWidth={isHovered ? 3 : 2}
                          className="cursor-pointer transition-all"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              campus: s.campus,
                              year: d.year,
                              periodName: d.periodName,
                              value: val,
                              gold: d.gold,
                              silver: d.silver,
                              bronze: d.bronze,
                            })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      )
                    })}
                  </g>
                )
              })}
            </svg>

            {/* Hover Tooltip Popup */}
            {hoveredPoint && (
              <div className="absolute top-4 right-6 p-3 rounded-xl bg-[#0C241B] text-white text-xs shadow-xl border border-emerald-500/30 space-y-1 animate-in fade-in duration-150 pointer-events-none">
                <div className="font-extrabold text-[#A7F3D0]">{hoveredPoint.campus}</div>
                <div className="text-[11px] text-slate-300">
                  {hoveredPoint.periodName} ({hoveredPoint.year})
                </div>
                <div className="font-mono text-sm font-black text-[#D5C49A] pt-1">
                  {hoveredPoint.value} {metricMode === 'points' ? 'Poin' : 'Penghargaan'}
                </div>
                <div className="text-[10px] text-emerald-200 flex gap-2 pt-1 border-t border-emerald-800">
                  <span>🥇 {hoveredPoint.gold}</span>
                  <span>🥈 {hoveredPoint.silver}</span>
                  <span>🥉 {hoveredPoint.bronze}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Detailed Performance Progression Matrix */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-[#0C241B] uppercase tracking-wider">
          Matriks Rekapitulasi Capaian Historis
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Kontingen Kampus</th>
                {periods.map((p) => (
                  <th key={p.id} className="py-3 px-4 text-center">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {series.map((s) => (
                <tr key={s.campus} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#0C241B]">
                    <button
                      onClick={() => onSelectCampus(campusToSlug(s.campus))}
                      className="cursor-pointer hover:underline hover:text-[#166534] text-left"
                    >
                      {s.campus}
                    </button>
                  </td>
                  {s.data.map((d) => (
                    <td key={d.periodId} className="py-3 px-4 text-center">
                      <div className="font-bold text-[#166534] font-mono">{d.points} Poin</div>
                      <div className="text-[10px] text-slate-400">
                        {d.totalAwards > 0 ? `${d.totalAwards} Penghargaan` : '0 Penghargaan'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
