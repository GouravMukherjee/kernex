"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchDeployments } from "@/lib/data/mock"
import { createDeployment } from "@/lib/api/services"
import { formatDate, cn } from "@/lib/utils"
import { Rocket, Plus } from "lucide-react"

export default function DeploymentsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [bundleVersion, setBundleVersion] = useState("")
  const [targetDevicesCsv, setTargetDevicesCsv] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const { data: deployments = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["deployments"],
    queryFn: fetchDeployments,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-success bg-success/10"
      case "in_progress":
        return "text-accent bg-accent/10"
      case "pending":
        return "text-warning bg-warning/10"
      case "failed":
        return "text-danger bg-danger/10"
      default:
        return "text-text-dim bg-surface-2"
    }
  }

  const handleCreate = async () => {
    const targets = targetDevicesCsv
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
    if (!bundleVersion.trim() || targets.length === 0) {
      setActionMessage("Bundle version and at least one target device are required.")
      return
    }

    setSubmitting(true)
    setActionMessage(null)
    try {
      const deploymentId = await createDeployment(bundleVersion.trim(), targets)
      setActionMessage(`Deployment created: ${deploymentId}`)
      setBundleVersion("")
      setTargetDevicesCsv("")
      setCreateOpen(false)
      await refetch()
    } catch (e) {
      setActionMessage(`Failed to create deployment: ${(e as Error)?.message || "unknown error"}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Deployments</h1>
          <p className="text-sm text-text-muted mt-1">Monitor deployment activities</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen((v) => !v)}>
          <Plus className="w-4 h-4" />
          {createOpen ? "Close" : "New Deployment"}
        </Button>
      </div>

      {createOpen && (
        <Card className="p-4 mb-4 grid gap-3">
          <p className="text-sm text-text-muted">Create deployment</p>
          <label className="grid gap-1">
            <span className="text-xs text-text-dim">Bundle Version</span>
            <input
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
              value={bundleVersion}
              onChange={(e) => setBundleVersion(e.target.value)}
              placeholder="e.g. v2.3.0"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-dim">Target Device IDs (comma-separated)</span>
            <input
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
              value={targetDevicesCsv}
              onChange={(e) => setTargetDevicesCsv(e.target.value)}
              placeholder="device-id-1, device-id-2"
            />
          </label>
          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Deployment"}
            </Button>
            {actionMessage && <p className="text-xs text-text-muted">{actionMessage}</p>}
          </div>
        </Card>
      )}

      {!createOpen && actionMessage && <p className="text-xs text-text-muted mb-3">{actionMessage}</p>}

      <div className="grid gap-4">
        {isLoading && <p className="text-sm text-text-dim">Loading deployments...</p>}
        {isError && (
          <p className="text-sm text-danger">
            Failed to load deployments: {(error as Error)?.message || "unknown error"}
          </p>
        )}
        {!isLoading && !isError && deployments.length === 0 && (
          <p className="text-sm text-text-dim">No deployments found.</p>
        )}
        {deployments.map((deployment) => (
          <Card
            key={deployment.id}
            className="p-5 hover:shadow-[0_1px_4px_rgba(0,0,0,0.5),0_10px_28px_rgba(0,0,0,0.2)] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text">Deploy {deployment.bundleVersion}</h3>
                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider",
                        getStatusColor(deployment.status)
                      )}
                    >
                      {deployment.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-muted">{deployment.targetDevices} target devices</span>
                    <span className="text-xs text-text-dim">•</span>
                    <span className="text-xs text-success">{deployment.successCount} success</span>
                    {deployment.failedCount > 0 && (
                      <>
                        <span className="text-xs text-text-dim">•</span>
                        <span className="text-xs text-danger">{deployment.failedCount} failed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-dim">Started</p>
                <p className="text-xs text-text-muted mt-0.5">{formatDate(deployment.startedAt)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
