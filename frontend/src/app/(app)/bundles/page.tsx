"use client"

import { useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchBundles } from "@/lib/data/mock"
import { uploadBundleToAPI } from "@/lib/api/services"
import { formatDate, cn } from "@/lib/utils"
import { Package, Upload } from "lucide-react"

export default function BundlesPage() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [version, setVersion] = useState("")
  const [modelName, setModelName] = useState("")
  const [modelSizeMb, setModelSizeMb] = useState("")
  const [status, setStatus] = useState("active")
  const [file, setFile] = useState<File | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const { data: bundles = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["bundles"],
    queryFn: fetchBundles,
  })

  const getStatusColor = (bundleStatus: string) => {
    switch (bundleStatus) {
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

  const handleUpload = async () => {
    if (!file || !version.trim()) {
      setActionMessage("Version and file are required.")
      return
    }

    setUploading(true)
    setActionMessage(null)
    try {
      const parsedSize = modelSizeMb.trim() ? Number(modelSizeMb.trim()) : undefined
      const manifest = {
        version: version.trim(),
        name: modelName.trim() || version.trim(),
        size: parsedSize ? `${parsedSize} MB` : "unknown",
        status,
        model: {
          name: modelName.trim() || version.trim(),
          size_mb: parsedSize,
        },
      }

      await uploadBundleToAPI(file, manifest)
      setActionMessage("Bundle uploaded successfully.")
      setVersion("")
      setModelName("")
      setModelSizeMb("")
      setStatus("active")
      setFile(null)
      setUploadOpen(false)
      await refetch()
    } catch (e) {
      setActionMessage(`Upload failed: ${(e as Error)?.message || "unknown error"}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Bundles</h1>
          <p className="text-sm text-text-muted mt-1">Manage ML model bundles</p>
        </div>
        <Button className="gap-2" onClick={() => setUploadOpen((v) => !v)}>
          <Upload className="w-4 h-4" />
          {uploadOpen ? "Close Upload" : "Upload Bundle"}
        </Button>
      </div>

      {uploadOpen && (
        <Card className="p-4 mb-4 grid gap-3">
          <p className="text-sm text-text-muted">Upload new bundle</p>
          <InputRow label="Version">
            <input
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. v2.3.0"
            />
          </InputRow>
          <InputRow label="Model Name">
            <input
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. qwen-2.5b"
            />
          </InputRow>
          <InputRow label="Model Size MB">
            <input
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
              value={modelSizeMb}
              onChange={(e) => setModelSizeMb(e.target.value)}
              placeholder="e.g. 3200"
            />
          </InputRow>
          <InputRow label="Status">
            <select
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">active</option>
              <option value="testing">testing</option>
              <option value="deprecated">deprecated</option>
            </select>
          </InputRow>
          <InputRow label="Bundle File (.tar.gz)">
            <input
              type="file"
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-3 text-sm pt-1.5"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </InputRow>
          <div className="flex items-center gap-2">
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Submit Upload"}
            </Button>
            {actionMessage && <p className="text-xs text-text-muted">{actionMessage}</p>}
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading && <p className="text-sm text-text-dim">Loading bundles...</p>}
        {isError && (
          <p className="text-sm text-danger">
            Failed to load bundles: {(error as Error)?.message || "unknown error"}
          </p>
        )}
        {!isLoading && !isError && bundles.length === 0 && (
          <p className="text-sm text-text-dim">No bundles found.</p>
        )}
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
                    <h3 className="text-sm font-semibold text-text">{bundle.name}</h3>
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
                    <span className="text-xs font-mono text-text-muted">{bundle.version}</span>
                    <span className="text-xs text-text-dim">•</span>
                    <span className="text-xs text-text-muted">{bundle.size}</span>
                    <span className="text-xs text-text-dim">•</span>
                    <span className="text-xs text-text-muted">Deployed to {bundle.deployedCount} devices</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-dim">Uploaded</p>
                <p className="text-xs text-text-muted mt-0.5">{formatDate(bundle.uploadedAt)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function InputRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-text-dim">{label}</span>
      {children}
    </label>
  )
}
