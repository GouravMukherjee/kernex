"use client"

import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { ChartData } from "@/lib/data/mock"

interface DeploymentsBarChartProps {
  data: ChartData[]
}

export function DeploymentsBarChart({ data }: DeploymentsBarChartProps) {
  return (
    <Card className="h-full p-6 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-text">Deployments (7 days)</h3>
        <p className="text-xs text-text-dim mt-1">Daily deployment activity</p>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(255,255,255,0.025)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="rgba(220,225,235,0.35)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis
              stroke="rgba(220,225,235,0.35)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0A0C10",
                border: "1px solid rgba(255,255,255,0.03)",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{
                color: "rgba(220,225,235,0.88)",
                fontSize: "11px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
              itemStyle={{
                color: "rgba(220,225,235,0.68)",
                fontSize: "11px",
              }}
              cursor={{ fill: "rgba(77,99,216,0.04)" }}
            />
            <Bar
              dataKey="deployments"
              fill="#4D63D8"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
