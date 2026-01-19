"use client"

import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchBundles } from "@/lib/data/mock"
import { formatDate, cn } from "@/lib/utils"
import { Package, Upload } from "lucide-react"

export default function BundlesPage() {
  const { data: bundles = [] } = useQuery({
    queryKey: ["bundles"],
    queryFn: fetchBundles,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-success bg-success/10"
      case "testing":
        return "text-warning bg-warning/10"
      case "deprecated":
        return "text-text-dim bg-surface-2"
      default:
        return "text-text-dim bg-surface-2"
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Bundles</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage ML model bundles
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Bundle
        </Button>
      </div>

      <div className="grid gap-4">
        {bundles.map((bundle) => (
          <Card
            key={bundle.id}
            className="p-5 hover:shadow-[0_1px_4px_rgba(0,0,0,0.5),0_10px_28px_rgba(0,0,0,0.2)] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text">
                      {bundle.name}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider",
                        getStatusColor(bundle.status)
                      )}
                    >
                      {bundle.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-mono text-text-muted">
                      {bundle.version}
                    </span>
                    <span className="text-xs text-text-dim">•</span>
                    <span className="text-xs text-text-muted">
                      {bundle.size}
                    </span>
                    <span className="text-xs text-text-dim">•</span>
                    <span className="text-xs text-text-muted">
                      Deployed to {bundle.deployedCount} devices
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-dim">Uploaded</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatDate(bundle.uploadedAt)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
