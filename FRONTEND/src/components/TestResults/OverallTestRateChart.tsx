import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Text,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { TestResultResponse } from "@/client"
import { getScoreBadgeVariant } from "@/lib/testResultFields"

// Same red/orange/green thresholds as the percentage badges elsewhere, so a
// point's dot color always means the same thing as its badge color.
const DOT_COLOR: Record<ReturnType<typeof getScoreBadgeVariant>, string> = {
  default: "var(--primary)",
  warning: "var(--score-warning)",
  destructive: "var(--score-danger)",
}

interface ChartPoint {
  build: string
  overall_test_rate: number
}

function BuildAxisTick({ x, y, payload }: {
  x?: number
  y?: number
  payload?: { value: string }
}) {
  if (x === undefined || y === undefined || !payload) {
    return null
  }
  return (
    <Text
      x={x}
      y={y}
      dy={4}
      angle={-20}
      textAnchor="end"
      verticalAnchor="start"
      fill="var(--foreground)"
      fontSize={11}
    >
      {payload.value}
    </Text>
  )
}

function ColoredDot({ cx, cy, payload }: {
  cx?: number
  cy?: number
  payload?: ChartPoint
}) {
  if (cx === undefined || cy === undefined || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={DOT_COLOR[getScoreBadgeVariant(payload.overall_test_rate)]}
      stroke="var(--background)"
      strokeWidth={1}
    />
  )
}

interface OverallTestRateChartProps {
  data: TestResultResponse[]
}

export function OverallTestRateChart({ data }: OverallTestRateChartProps) {
  const chartData: ChartPoint[] = data
    .filter((result) => result.overall_test_rate !== null)
    .map((result) => ({
      build: result.build,
      overall_test_rate: result.overall_test_rate as number,
    }))
    // The table lists newest-first; the chart reads oldest -> newest,
    // left -> right, so it reads like a timeline.
    .reverse()

  if (chartData.length === 0) {
    return null
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 70, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="build"
            tick={<BuildAxisTick />}
            interval={0}
            height={56}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "var(--foreground)" }}
            width={40}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Overall Test Rate"]}
          />
          <Line
            type="monotone"
            dataKey="overall_test_rate"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={<ColoredDot />}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
