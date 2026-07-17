import { Component, OnInit, inject } from "@angular/core"
import { RouterLink } from "@angular/router"
import { AsyncPipe, DecimalPipe } from "@angular/common"

import { AuthService } from "@services/auth.service"
import { AdminDashboardService } from "@services/admin-dashboard.service"
import { IconComponent } from "@shared/icons/icons.component"
import { AppIconName } from "@shared/icons/icons"
import { ActivityChartComponent, ActivityPoint } from "./components/activity-chart.component"
import { StatusDonutComponent, StatusSegment } from "./components/status-donut.component"

export interface AdminStatCard {
  label: string
  value: number
  unit?: string
  sub: string
  warnSub?: boolean
  accentColor: string
}

export interface BackendAuditEvent {
  type: string
  title: string
  meta: string
  time: string
}

export interface UIAuditEvent extends BackendAuditEvent {
  icon: AppIconName
  iconBg: string
  iconColor: string
  badge?: { label: string; bg: string; text: string }
}

export type DocStatus = "Signed" | "Pending" | string

export interface OrgDoc {
  name: string
  owner: string
  file_type: string
  date: string
  status: DocStatus
}

export interface QuickAction {
  icon: AppIconName
  label: string
  path: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Signed: { bg: "bg-[oklch(0.94_0.04_250)]", text: "text-[oklch(0.4_0.15_250)]" },
  Pending: { bg: "bg-[oklch(0.94_0.07_68)]", text: "text-[oklch(0.42_0.12_68)]" },
}

const AUDIT_UI_MAP: Record<string, { icon: AppIconName; badge?: any }> = {
  signature: {
    icon: "Barcode",
    badge: {
      label: "Signed",
      bg: "bg-[oklch(0.94_0.04_250)]",
      text: "text-[oklch(0.4_0.15_250)]",
    },
  },
  verification_success: {
    icon: "CircleCheck",
    badge: {
      label: "Success",
      bg: "bg-[oklch(0.93_0.06_149)]",
      text: "text-[oklch(0.38_0.12_149)]",
    },
  },
  verification_tampered: {
    icon: "CircleAlert",
    badge: {
      label: "Tampered",
      bg: "bg-[oklch(0.96_0.04_25.019)]",
      text: "text-[oklch(65.492%_0.20876_25.019)]",
    },
  },
  verification_invalid: {
    icon: "CircleAlert",
    badge: {
      label: "Invalid",
      bg: "bg-[oklch(0.96_0.04_25.019)]",
      text: "text-[oklch(65.492%_0.20876_25.019)]",
    },
  },
}

const DONUT_COLORS: Record<string, string> = {
  Signed: "oklch(0.848358 0.075268 259.0273)",
  Pending: "oklch(0.9294 0.0351 250.86)",
}

@Component({
  selector: "page-admin-overview",
  standalone: true,
  imports: [
    RouterLink,
    AsyncPipe,
    DecimalPipe,
    IconComponent,
    ActivityChartComponent,
    StatusDonutComponent,
  ],
  templateUrl: "./admin-overview.page.html",
})
export class AdminOverviewPage implements OnInit {
  private authService = inject(AuthService)
  private dashboardService = inject(AdminDashboardService)

  user$ = this.authService.user$
  isLoading = true
  today = ""
  greeting = ""

  storageUsedBytes = 0
  storageUsedDisplay = "0 Bytes"

  statCards: AdminStatCard[] = []
  activityData: ActivityPoint[] = []
  statusSegments: StatusSegment[] = []
  auditEvents: UIAuditEvent[] = []
  orgDocs: OrgDoc[] = []

  readonly quickActions: QuickAction[] = [
    {
      icon: "Link",
      label: "Invite a user",
      path: "/dashboard/admin/users",
    },
    {
      icon: "ShieldCheck",
      label: "View full logs",
      path: "/dashboard/admin/audit",
    },
    {
      icon: "KeyRound",
      label: "Review signatures",
      path: "/dashboard/admin/documents",
    },
  ]

  formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  ngOnInit(): void {
    const now = new Date()
    const hour = now.getHours()
    this.today = now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    this.greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

    this.dashboardService.getAdminOverview().subscribe((data) => {
      this.isLoading = false
      if (!data) return

      this.storageUsedBytes = data.storageUsedBytes
      this.storageUsedDisplay = this.formatBytes(data.storageUsedBytes)
      const splitDisplay = this.storageUsedDisplay.split(" ")
      const storageValue = parseFloat(splitDisplay[0]) || 0
      const storageUnit = " " + (splitDisplay[1] || "Bytes")

      this.statCards = [
        {
          label: "Total Documents",
          value: data.totalDocuments,
          sub: "All time records",
          accentColor: "bg-[oklch(0.42_0.08_240)]",
        },
        {
          label: "Active Users",
          value: data.activeUsers7d,
          sub: `of ${data.totalUsers.toLocaleString("en-GB")} total users`,
          accentColor: "bg-[oklch(0.55_0.14_149)]",
        },
        {
          label: "Pending Signatures",
          value: data.pendingOrgWide,
          sub: `Awaiting action`,
          warnSub: data.pendingOrgWide > 0,
          accentColor: "bg-[oklch(0.68_0.13_68)]",
        },
        {
          label: "Storage Used",
          value: storageValue,
          unit: storageUnit,
          sub: "Total Consumption across organization",
          accentColor: "bg-[oklch(0.70_0.04_240)]",
        },
      ]

      this.activityData = data.activityData
      this.orgDocs = data.orgDocs
      this.statusSegments = data.statusSegments.map((segment) => ({
        ...segment,
        color: DONUT_COLORS[segment.label] || "#ccc",
      }))
      this.auditEvents = data.auditEvents.map((event) => {
        const uiConfig = AUDIT_UI_MAP[event.type] || AUDIT_UI_MAP["verification_invalid"]
        return {
          ...event,
          ...uiConfig,
        }
      })
    })
  }

  statusStyle(status: string): { bg: string; text: string } {
    return (
      STATUS_STYLES[status] || { bg: "bg-[oklch(0.94_0.005_95]", text: "text-[oklch(0.38_0_0)]" }
    )
  }
}
