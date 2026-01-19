"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle, Circle } from "lucide-react"

interface SuccessRatePanelProps {
  rate: number
  total: number
  success: number
  failed: number
}

export function SuccessRatePanel({
  rate,
  total,
  success,
  failed,
}: SuccessRatePanelProps) {
  return (
    <Card className="h-full p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text">Success Rate</h3>
          <p className="text-xs text-text-dim mt-1">Last 30 days</p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-semibold text-text tracking-tight">
            {rate}
          </span>
          <span className="text-xl text-text-muted">%</span>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-text-dim fill-text-dim" />
              <span className="text-xs text-text-muted">Total</span>
            </div>
            <span className="text-sm font-medium text-text">{total}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-success" />
              <span className="text-xs text-text-muted">Success</span>
            </div>
            <span className="text-sm font-medium text-success">{success}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-3 h-3 text-danger" />
              <span className="text-xs text-text-muted">Failed</span>
            </div>
            <span className="text-sm font-medium text-danger">{failed}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
