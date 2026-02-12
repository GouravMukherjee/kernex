"use client"

import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { fetchLogsFromAPI } from "@/lib/api/services"

export default function LogsPage() {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["logs"],
    queryFn: () => fetchLogsFromAPI(200),
    refetchInterval: 10000,
  })

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
        {isLoading && <p className="text-text-dim">Loading logs...</p>}
        {error && (
          <p className="text-danger">
            Unable to load logs from backend.
          </p>
        )}
        {!isLoading && !error && logs.length === 0 && (
          <p className="text-text-dim">No logs available.</p>
        )}
        <div className="space-y-1">
          {logs.map((log, i) => (
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
