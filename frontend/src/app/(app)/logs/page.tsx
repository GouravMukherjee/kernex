"use client"

import { Card } from "@/components/ui/card"
import { Terminal } from "lucide-react"

const mockLogs = [
  {
    timestamp: "2026-01-18T10:23:45Z",
    level: "INFO",
    message: "Device edge-node-prod-01 heartbeat received",
  },
  {
    timestamp: "2026-01-18T10:23:42Z",
    level: "INFO",
    message: "Deployment deploy-001 completed successfully",
  },
  {
    timestamp: "2026-01-18T10:23:38Z",
    level: "WARNING",
    message: "Device edge-node-prod-03 high CPU usage: 78%",
  },
  {
    timestamp: "2026-01-18T10:23:30Z",
    level: "INFO",
    message: "Bundle v2.1.4 deployed to 24 devices",
  },
  {
    timestamp: "2026-01-18T10:23:15Z",
    level: "ERROR",
    message: "Device edge-node-dev-01 connection timeout",
  },
]

export default function LogsPage() {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "INFO":
        return "text-text-muted"
      case "WARNING":
        return "text-warning"
      case "ERROR":
        return "text-danger"
      default:
        return "text-text-muted"
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text">Logs</h1>
        <p className="text-sm text-text-muted mt-1">
          System and device activity logs
        </p>
      </div>

      <Card className="p-4 bg-[#08090C] border-border font-mono text-xs">
        <div className="space-y-1">
          {mockLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 py-1">
              <span className="text-text-dim whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span
                className={`w-16 font-medium ${getLevelColor(log.level)}`}
              >
                [{log.level}]
              </span>
              <span className="text-text-muted flex-1">{log.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
