"use client"

import { Card } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text">Admin Settings</h1>
        <p className="text-sm text-text-muted mt-1">
          System configuration and preferences
        </p>
      </div>

      <Card className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <Settings className="w-16 h-16 text-text-dim mb-4" />
        <h3 className="text-lg font-medium text-text mb-2">
          Admin Panel
        </h3>
        <p className="text-sm text-text-muted text-center max-w-md">
          Configure system settings, manage users, and control platform
          behavior.
        </p>
      </Card>
    </div>
  )
}
