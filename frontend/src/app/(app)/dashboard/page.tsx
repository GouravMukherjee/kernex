"use client"

import { useQuery } from "@tanstack/react-query"
import { MetricCard } from "@/components/kernex/MetricCard"
import { DeploymentsBarChart } from "@/components/kernex/DeploymentsBarChart"
import { SuccessRatePanel } from "@/components/kernex/SuccessRatePanel"
import { RecentDevicesTable } from "@/components/kernex/RecentDevicesTable"
import { DeploymentSuccessPanel } from "@/components/kernex/DeploymentSuccessPanel"
import {
  fetchMetrics,
  fetchChartData,
  fetchSuccessRate,
  fetchDevices,
  fetchDeployments,
  type SuccessRateData,
} from "@/lib/data/mock"
import { useUIStore } from "@/lib/store/ui"

export default function DashboardPage() {
  const { openInspector } = useUIStore()

  const { data: metricsData = [], isLoading: isMetricsLoading, isError: isMetricsError, error: metricsError } = useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    refetchInterval: 10000,
  })

  const { data: chartData = [], isLoading: isChartLoading, isError: isChartError, error: chartError } = useQuery({
    queryKey: ["chartData"],
    queryFn: fetchChartData,
  })

  const { data: successRate, isLoading: isSuccessLoading, isError: isSuccessError, error: successError } = useQuery<SuccessRateData>({
    queryKey: ["successRate"],
    queryFn: fetchSuccessRate,
  })

  const { data: devices = [], isLoading: isDevicesLoading, isError: isDevicesError, error: devicesError } = useQuery({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 10000,
  })

  const { data: deployments = [], isLoading: isDeploymentsLoading, isError: isDeploymentsError, error: deploymentsError } = useQuery({
    queryKey: ["deployments"],
    queryFn: fetchDeployments,
  })

  const metrics = metricsData
  const hasError =
    isMetricsError || isChartError || isSuccessError || isDevicesError || isDeploymentsError
  const isLoading =
    isMetricsLoading || isChartLoading || isSuccessLoading || isDevicesLoading || isDeploymentsLoading
  const errorMessage =
    (metricsError as Error)?.message ||
    (chartError as Error)?.message ||
    (successError as Error)?.message ||
    (devicesError as Error)?.message ||
    (deploymentsError as Error)?.message

  // Calculate deployment stats
  const totalDeployments = deployments.length
  const successDeployments = deployments.filter(
    (d) => d.status === "completed"
  ).length
  const failedDeployments = deployments.filter(
    (d) => d.status === "failed"
  ).length

  return (
    <div className="p-6">
      {isLoading && <p className="text-sm text-text-dim mb-4">Loading dashboard data...</p>}
      {hasError && (
        <p className="text-sm text-danger mb-4">
          Failed to load some dashboard data: {errorMessage || "unknown error"}
        </p>
      )}
      {/* Single 12-column grid with 3 fixed rows */}
      <div className="grid grid-cols-12 grid-rows-[96px_360px_280px] gap-4">
        {/* Row 1: Metric Cards - 4 cards × col-span-3 */}
        {metrics.map((metric) => (
          <div key={metric.label} className="col-span-3 h-full">
            <MetricCard
              label={metric.label}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
            />
          </div>
        ))}

        {/* Row 2: Deployments Chart + Success Rate */}
        <div className="col-span-8 h-full">
          <DeploymentsBarChart data={chartData} />
        </div>
        <div className="col-span-4 h-full">
          {successRate && (
            <SuccessRatePanel
              rate={successRate.rate}
              total={successRate.total}
              success={successRate.success}
              failed={successRate.failed}
            />
          )}
        </div>

        {/* Row 3: Recent Devices Table + Deployment Success */}
        <div className="col-span-8 h-full">
          <RecentDevicesTable
            devices={devices}
            onDeviceClick={openInspector}
          />
        </div>
        <div className="col-span-4 h-full">
          <DeploymentSuccessPanel
            total={totalDeployments}
            success={successDeployments}
            failed={failedDeployments}
          />
        </div>
      </div>
    </div>
  )
}
