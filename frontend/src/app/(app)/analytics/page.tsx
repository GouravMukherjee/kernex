"use client"

import { Card } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text">Analytics</h1>
        <p className="text-sm text-text-muted mt-1">
          Device and deployment analytics
        </p>
      </div>

      <Card className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <BarChart3 className="w-16 h-16 text-text-dim mb-4" />
        <h3 className="text-lg font-medium text-text mb-2">
          Analytics Dashboard
        </h3>
        <p className="text-sm text-text-muted text-center max-w-md">
          Advanced analytics and insights for device performance, deployment
          trends, and system health metrics.
        </p>
      </Card>
    </div>
  )
}
