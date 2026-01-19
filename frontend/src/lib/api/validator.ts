/**
 * Backend Integration Validator
 * 
 * Run in browser console to test backend connectivity and data mapping
 * 
 * Usage:
 * 1. Open http://localhost:3000/dashboard
 * 2. Open DevTools (F12) → Console
 * 3. Copy and paste this entire file
 * 4. Run: validateBackendIntegration()
 */

import apiClient from "@/lib/api/client"

interface TestResult {
  endpoint: string
  status: "✅ PASS" | "⚠️ WARNING" | "❌ FAIL"
  details: string
  responseTime: number
  dataCount?: number
}

interface ValidationReport {
  timestamp: string
  apiBaseUrl: string
  tests: TestResult[]
  summary: {
    passed: number
    warnings: number
    failed: number
  }
}

export async function validateBackendIntegration(): Promise<ValidationReport> {
  const results: TestResult[] = []
  const startTime = Date.now()

  console.log(
    "%c🔍 Starting Backend Integration Validation...",
    "color: blue; font-size: 14px; font-weight: bold"
  )
  console.log("API Base URL:", apiClient.defaults.baseURL)

  // Test 1: Health Check
  try {
    const startTest = Date.now()
    const response = await apiClient.get("/health")
    const responseTime = Date.now() - startTest
    results.push({
      endpoint: "GET /health",
      status: "✅ PASS",
      details: "Backend is responding",
      responseTime,
    })
  } catch (error) {
    results.push({
      endpoint: "GET /health",
      status: "❌ FAIL",
      details: `Backend not responding: ${(error as any).message}`,
      responseTime: 0,
    })
  }

  // Test 2: Devices Endpoint
  try {
    const startTest = Date.now()
    const response = await apiClient.get("/devices")
    const responseTime = Date.now() - startTest
    const deviceCount = response.data.devices?.length || 0

    if (deviceCount > 0) {
      // Validate data structure
      const sample = response.data.devices[0]
      const requiredFields = ["device_id", "status"]
      const hasAllFields = requiredFields.every((field) => field in sample)

      results.push({
        endpoint: "GET /devices",
        status: hasAllFields ? "✅ PASS" : "⚠️ WARNING",
        details: `Retrieved ${deviceCount} devices. ${
          hasAllFields
            ? "Data structure valid."
            : "Missing expected fields. Check mapping."
        }`,
        responseTime,
        dataCount: deviceCount,
      })
    } else {
      results.push({
        endpoint: "GET /devices",
        status: "⚠️ WARNING",
        details: "No devices in backend. Database may be empty.",
        responseTime,
        dataCount: 0,
      })
    }
  } catch (error) {
    results.push({
      endpoint: "GET /devices",
      status: "❌ FAIL",
      details: `Failed to fetch devices: ${(error as any).message}`,
      responseTime: 0,
    })
  }

  // Test 3: Bundles Endpoint
  try {
    const startTest = Date.now()
    const response = await apiClient.get("/bundles")
    const responseTime = Date.now() - startTest
    const bundleCount = response.data.bundles?.length || 0

    if (bundleCount >= 0) {
      results.push({
        endpoint: "GET /bundles",
        status: bundleCount > 0 ? "✅ PASS" : "⚠️ WARNING",
        details: `Retrieved ${bundleCount} bundles. ${
          bundleCount > 0 ? "" : "No bundles uploaded yet."
        }`,
        responseTime,
        dataCount: bundleCount,
      })
    }
  } catch (error) {
    results.push({
      endpoint: "GET /bundles",
      status: "❌ FAIL",
      details: `Failed to fetch bundles: ${(error as any).message}`,
      responseTime: 0,
    })
  }

  // Test 4: Deployments Endpoint
  try {
    const startTest = Date.now()
    const response = await apiClient.get("/deployments")
    const responseTime = Date.now() - startTest
    const deploymentCount = response.data.deployments?.length || 0

    if (deploymentCount >= 0) {
      results.push({
        endpoint: "GET /deployments",
        status: deploymentCount > 0 ? "✅ PASS" : "⚠️ WARNING",
        details: `Retrieved ${deploymentCount} deployments. ${
          deploymentCount > 0
            ? ""
            : "No deployments yet. Create one to test."
        }`,
        responseTime,
        dataCount: deploymentCount,
      })
    }
  } catch (error) {
    results.push({
      endpoint: "GET /deployments",
      status: "❌ FAIL",
      details: `Failed to fetch deployments: ${(error as any).message}`,
      responseTime: 0,
    })
  }

  // Calculate summary
  const summary = {
    passed: results.filter((r) => r.status === "✅ PASS").length,
    warnings: results.filter((r) => r.status === "⚠️ WARNING").length,
    failed: results.filter((r) => r.status === "❌ FAIL").length,
  }

  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    apiBaseUrl: apiClient.defaults.baseURL || "unknown",
    tests: results,
    summary,
  }

  // Print formatted report
  console.log("\n%c═══════════════════════════════════════", "color: cyan")
  console.log("%c📋 VALIDATION REPORT", "color: cyan; font-size: 14px; font-weight: bold")
  console.log("%c═══════════════════════════════════════", "color: cyan")

  results.forEach((result) => {
    const icon = result.status.includes("PASS") ? "✅" : result.status.includes("WARNING") ? "⚠️" : "❌"
    console.log(`\n${icon} ${result.endpoint}`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Details: ${result.details}`)
    console.log(`   Response Time: ${result.responseTime}ms`)
    if (result.dataCount !== undefined) {
      console.log(`   Data Count: ${result.dataCount}`)
    }
  })

  console.log("\n%c═══════════════════════════════════════", "color: cyan")
  console.log("%c📊 SUMMARY", "color: cyan; font-size: 14px; font-weight: bold")
  console.log("%c═══════════════════════════════════════", "color: cyan")
  console.log(`✅ Passed: ${summary.passed}`)
  console.log(`⚠️  Warnings: ${summary.warnings}`)
  console.log(`❌ Failed: ${summary.failed}`)
  console.log(`⏱️  Total Time: ${Date.now() - startTime}ms`)

  if (summary.failed === 0) {
    console.log(
      "%c✨ All critical tests passed! Backend integration is working.",
      "color: green; font-size: 12px; font-weight: bold"
    )
  } else {
    console.log(
      "%c⚠️  Some tests failed. Check backend status and configuration.",
      "color: red; font-size: 12px; font-weight: bold"
    )
  }

  console.log("\n%cDetailed Report Object:", "color: gray; font-style: italic")
  console.log(report)

  return report
}

// Auto-run on import
if (typeof window !== "undefined") {
  (window as any).validateBackendIntegration = validateBackendIntegration
  console.log(
    "%c📝 Backend validation loaded. Run: validateBackendIntegration()",
    "color: orange; font-style: italic"
  )
}
