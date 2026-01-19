"use client"

import { useQuery } from "@tanstack/react-query"
import { useUIStore } from "@/lib/store/ui"
import { fetchDevices } from "@/lib/data/mock"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { formatRelativeTime, cn } from "@/lib/utils"
import { Monitor, Cpu, HardDrive, MapPin, Globe } from "lucide-react"

export function DeviceInspector() {
  const { inspectorOpen, selectedDevice, closeInspector } = useUIStore()
  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: fetchDevices,
  })

  const device = devices.find((d) => d.id === selectedDevice)

  if (!device) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-success bg-success/10"
      case "offline":
        return "text-text-dim bg-surface-2"
      case "degraded":
        return "text-warning bg-warning/10"
      default:
        return "text-text-dim bg-surface-2"
    }
  }

  return (
    <Sheet open={inspectorOpen} onOpenChange={(open) => !open && closeInspector()}>
      <SheetContent>
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/8 border border-accent/15 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-accent/90" />
            </div>
            <div>
              <SheetTitle>{device.name}</SheetTitle>
              <SheetDescription>{device.id}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
              Status
            </p>
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded uppercase tracking-wider",
                getStatusColor(device.status)
              )}
            >
              {device.status}
            </span>
          </div>

          <Separator />

          {/* Bundle Version */}
          <div>
            <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
              Bundle Version
            </p>
            <span className="text-sm font-mono text-text bg-surface-2 px-2 py-1 rounded">
              {device.bundleVersion}
            </span>
          </div>

          <Separator />

          {/* Resources */}
          <div>
            <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">
              Resources
            </p>
            <div className="space-y-3">
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-text-dim" />
                    <span className="text-xs text-text-muted">CPU Usage</span>
                  </div>
                  <span className="text-sm font-semibold text-text">
                    {device.cpuUsage}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${device.cpuUsage}%` }}
                  />
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-text-dim" />
                    <span className="text-xs text-text-muted">Memory Usage</span>
                  </div>
                  <span className="text-sm font-semibold text-text">
                    {device.memoryUsage}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${device.memoryUsage}%` }}
                  />
                </div>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div>
            <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">
              Location
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-text-dim" />
                <span className="text-sm text-text">{device.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-text-dim" />
                <span className="text-sm text-text-muted">{device.ipAddress}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Last Seen */}
          <div>
            <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
              Last Seen
            </p>
            <p className="text-sm text-text">
              {formatRelativeTime(device.lastSeen)}
            </p>
            <p className="text-xs text-text-dim mt-1">
              {new Date(device.lastSeen).toLocaleString()}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
