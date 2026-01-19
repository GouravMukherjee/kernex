"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  Monitor,
  Package,
  Rocket,
  ScrollText,
  Settings,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useUIStore } from "@/lib/store/ui"
import Image from "next/image"

const navigation = [
  {
    section: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    section: "Devices",
    items: [
      { name: "Devices", href: "/devices", icon: Monitor },
      { name: "Bundles", href: "/bundles", icon: Package },
      { name: "Deployments", href: "/deployments", icon: Rocket },
      { name: "Logs", href: "/logs", icon: ScrollText },
    ],
  },
  {
    section: "Settings",
    items: [{ name: "Admin", href: "/admin", icon: Settings }],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed } = useUIStore()

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full border-r border-border-weak bg-surface-1 flex flex-col transition-all duration-200 ease-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("h-14 flex items-center border-b border-border transition-all duration-200", sidebarCollapsed ? "justify-center px-3" : "px-3")}>
        {sidebarCollapsed ? (
          <Image
            src="/favicon.svg"
            alt="Kernex"
            width="32"
            height="32"
            className="w-7 h-7"
            priority
          />
        ) : (
          <Image
            src="/kernex-logo.png"
            alt="Kernex"
            width="160"
            height="40"
            className="h-8 w-auto"
            priority
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navigation.map((section) => (
          <div key={section.section}>
            {!sidebarCollapsed && (
              <div className="px-3 mb-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-dim">
                  {section.section}
                </p>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-[13px] font-medium transition-all duration-180",
                      sidebarCollapsed ? "gap-0 px-3 py-2 justify-center" : "gap-3 px-3 py-2",
                      isActive
                        ? "bg-accent/[0.06] text-accent/95 shadow-[inset_0_1px_0_rgba(91,116,255,0.08)]"
                        : "text-text-muted hover:text-text hover:bg-surface-2/40"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                    {!sidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        {sidebarCollapsed ? (
          <div className="flex justify-center" title="System Healthy">
            <div className="w-2 h-2 rounded-full bg-success/80 animate-pulse" />
          </div>
        ) : (
          <div className="px-3 py-2 rounded-lg bg-surface-2/30 border border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success/80 animate-pulse" />
              <span className="text-[11px] text-text-dim">System Healthy</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
