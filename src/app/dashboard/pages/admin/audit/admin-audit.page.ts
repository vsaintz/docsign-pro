import { Component, OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { AdminDashboardService, AuditLogEntry } from "@services/admin-dashboard.service"

@Component({
  selector: "admin-audit-page",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./admin-audit.page.html",
})
export class AdminAuditPage implements OnInit {
  private dashboardService = inject(AdminDashboardService)
  protected Math = Math

  logs: AuditLogEntry[] = []
  totalLogs = 0
  currentPage = 1
  pageSize = 10
  isLoading = true

  ngOnInit() {
    this.loadLogs()
  }

  loadLogs(page: number = 1) {
    this.isLoading = true
    this.dashboardService.getAdminAuditLogs(page).subscribe({
      next: (response) => {
        this.logs = response.results
        this.totalLogs = response.count
        this.currentPage = page
        this.isLoading = false
      },
      error: (err) => {
        console.error("Failed to load audit logs", err)
        this.isLoading = false
      },
    })
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.totalLogs) {
      this.loadLogs(this.currentPage + 1)
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadLogs(this.currentPage - 1)
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case "Signed":
        return "bg-[oklch(0.94_0.04_250)] text-[oklch(0.4_0.15_250)]"
      case "Verified":
        return "bg-[oklch(0.93_0.06_149)] text-[oklch(0.38_0.12_149)]"
      case "Tampered":
        return "bg-[oklch(0.96_0.04_25.019)] text-[oklch(65.492%_0.20876_25.019)]"
      default:
        return "bg-[oklch(0.96_0.04_25.019)] text-[oklch(65.492%_0.20876_25.019)]"
    }
  }
}
