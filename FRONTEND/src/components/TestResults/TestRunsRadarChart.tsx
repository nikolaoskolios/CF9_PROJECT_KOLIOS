import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import type { TestResultResponse } from "@/client"
import { SUBSYSTEM_TEST_FIELDS } from "@/lib/testResultFields"

const SERIES_COLORS = [
  "#2dd4bf", // teal
  "#fb923c", // orange
  "#60a5fa", // blue
  "#c084fc", // purple
  "#f472b6", // pink
  "#facc15", // yellow
  "#4ade80", // green
  "#f87171", // red
]

const RADAR_METRICS = [
  { name: "overall_test_rate" as const, label: "Overall Test Rate" },
  ...SUBSYSTEM_TEST_FIELDS,
]

interface TestRunsRadarChartProps {
  data: TestResultResponse[]
}

export function TestRunsRadarChart({ data }: TestRunsRadarChartProps) {
  const chartData = RADAR_METRICS.map((metric) => {
    const row: Record<string, string | number> = { metric: metric.label }
    for (const result of data) {
      row[result.build] = result[metric.name] ?? 0
    }
    return row
  })

  return (
    <div className="h-[550px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius="65%">
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          {data.map((result, index) => (
            <Radar
              key={result.build}
              name={result.build}
              dataKey={result.build}
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
              fill={SERIES_COLORS[index % SERIES_COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
