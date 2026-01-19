"use client"

import { Search, Bell, User, PanelLeftClose, PanelLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/lib/store/ui"

export function Topbar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <header className="h-14 border-b border-border bg-[#08090C]/95 backdrop-blur-sm flex items-center px-6 sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(255,255,255,0.02)]">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="mr-3 text-text-dim hover:text-text"
      >
        {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </Button>
      
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <Input
            type="search"
            placeholder="Search devices..."
            className="pl-9 h-9 bg-surface-2/60 border-border focus-visible:ring-accent/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2/40 border border-border mr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] text-text-muted font-medium">LIVE</span>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
        </Button>

        <Button variant="ghost" size="icon">
          <User className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
