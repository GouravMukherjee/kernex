"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"

interface MetricCardProps {
  label: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
}

export function MetricCard({ label, value, change, trend }: MetricCardProps) {
  return (
    <Card className="h-full p-5 hover:shadow-[0_1px_4px_rgba(0,0,0,0.5),0_10px_28px_rgba(0,0,0,0.2)] transition-all duration-200">
      <div className="space-y-2">
        <p className="text-[12px] font-medium text-text-dim uppercase tracking-wider">
          {label}
        </p>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-semibold text-text tracking-tight">
            {value}
          </p>
          {change && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded",
                trend === "up"
                  ? "text-success bg-success/10"
                  : trend === "down"
                  ? "text-danger bg-danger/10"
                  : "text-text-muted bg-surface-2"
              )}
            >
              {trend === "up" && <ArrowUp className="w-3 h-3" />}
              {trend === "down" && <ArrowDown className="w-3 h-3" />}
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
