"use client"

import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { fetchDevices } from "@/lib/data/mock"
import { formatRelativeTime, cn } from "@/lib/utils"
import { useUIStore } from "@/lib/store/ui"
import { Search } from "lucide-react"

export default function DevicesPage() {
  const { openInspector } = useUIStore()
  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 10000,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success"
      case "offline":
        return "bg-text-dim"
      case "degraded":
        return "bg-warning"
      default:
        return "bg-text-dim"
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Devices</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage and monitor edge devices
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <Input
            type="search"
            placeholder="Filter devices..."
            className="pl-9"
          />
        </div>
      </div>

      <Card className="p-6">
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                  Device Name
                </th>
                <th className="text-left py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                  Version
                </th>
                <th className="text-left py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                  CPU
                </th>
                <th className="text-left py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                  Memory
                </th>
                <th className="text-right py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr
                  key={device.id}
                  className="border-b border-border hover:bg-surface-2/30 cursor-pointer transition-colors duration-180"
                  onClick={() => openInspector(device.id)}
                >
                  <td className="py-3 px-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        getStatusColor(device.status)
                      )}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm font-medium text-text">
                      {device.name}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs font-mono text-text-muted bg-surface-2 px-2 py-0.5 rounded">
                      {device.bundleVersion}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-text-muted">
                      {device.location}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-text-muted">
                      {device.cpuUsage}%
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-text-muted">
                      {device.memoryUsage}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-xs text-text-muted">
                      {formatRelativeTime(device.lastSeen)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
