import { create } from "zustand"

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  // Inspector drawer
  inspectorOpen: boolean
  selectedDevice: string | null
  openInspector: (deviceId: string) => void
  closeInspector: () => void
  
  // Filters
  deviceFilter: string
  setDeviceFilter: (filter: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  inspectorOpen: false,
  selectedDevice: null,
  openInspector: (deviceId) => set({ inspectorOpen: true, selectedDevice: deviceId }),
  closeInspector: () => set({ inspectorOpen: false, selectedDevice: null }),
  
  deviceFilter: "",
  setDeviceFilter: (filter) => set({ deviceFilter: filter }),
}))
