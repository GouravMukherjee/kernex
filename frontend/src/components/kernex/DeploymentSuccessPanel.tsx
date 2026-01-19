"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, ResponsiveContainer } from "recharts"

interface DeploymentSuccessPanelProps {
  total: number
  success: number
  failed: number
}

const sparklineData = [
  { value: 12 },
  { value: 19 },
  { value: 15 },
  { value: 22 },
  { value: 18 },
  { value: 24 },
  { value: 20 },
]

export function DeploymentSuccessPanel({
  total,
  success,
  failed,
}: DeploymentSuccessPanelProps) {
  const successRate = ((success / total) * 100).toFixed(1)

  return (
    <Card className="h-full p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text">
            Deployment Success
          </h3>
          <p className="text-xs text-text-dim mt-1">7-day trend</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] text-text-dim uppercase tracking-wider mb-1">
              Total
            </p>
            <p className="text-2xl font-semibold text-text">{total}</p>
          </div>
          <div>
            <p className="text-[11px] text-text-dim uppercase tracking-wider mb-1">
              Success
            </p>
            <p className="text-2xl font-semibold text-success">{success}</p>
          </div>
          <div>
            <p className="text-[11px] text-text-dim uppercase tracking-wider mb-1">
              Failed
            </p>
            <p className="text-2xl font-semibold text-danger">{failed}</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Success Rate</span>
            <span className="text-sm font-semibold text-success">
              {successRate}%
            </span>
          </div>
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3DDC97"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  )
}
