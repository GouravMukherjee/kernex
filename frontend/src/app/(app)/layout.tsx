"use client"

import { Providers } from "@/components/providers"
import { Sidebar } from "@/components/kernex/Sidebar"
import { Topbar } from "@/components/kernex/Topbar"
import { DeviceInspector } from "@/components/kernex/DeviceInspector"
import { useUIStore } from "@/lib/store/ui"
import { cn } from "@/lib/utils"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-200 ease-out",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <DeviceInspector />
      </div>
    </Providers>
  )
}
