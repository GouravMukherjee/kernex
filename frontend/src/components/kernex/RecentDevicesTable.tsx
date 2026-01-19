"use client"

import { Card } from "@/components/ui/card"
import { Device } from "@/lib/data/mock"
import { formatRelativeTime, cn } from "@/lib/utils"

interface RecentDevicesTableProps {
  devices: Device[]
  onDeviceClick?: (deviceId: string) => void
}

export function RecentDevicesTable({
  devices,
  onDeviceClick,
}: RecentDevicesTableProps) {
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
    <Card className="h-full p-6 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-text">Recent Devices</h3>
        <p className="text-xs text-text-dim mt-1">Latest device activity</p>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                Device
              </th>
              <th className="text-left py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                Version
              </th>
              <th className="text-right py-3 px-2 text-[11px] font-medium text-text-dim uppercase tracking-wider">
                Last Seen
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.slice(0, 5).map((device) => (
              <tr
                key={device.id}
                className="border-b border-border hover:bg-surface-2/30 cursor-pointer transition-colors duration-180"
                onClick={() => onDeviceClick?.(device.id)}
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        getStatusColor(device.status)
                      )}
                    />
                    <span className="text-sm font-medium text-text">
                      {device.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="text-xs font-mono text-text-muted bg-surface-2 px-2 py-0.5 rounded">
                    {device.bundleVersion}
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
  )
}
