import { Component, OnInit, OnDestroy, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { Subject, Subscription, debounceTime, distinctUntilChanged } from "rxjs"

import { AdminDashboardService, AdminDocument } from "@services/admin-dashboard.service"
import { DocumentService } from "@services/document.service"
import { IconComponent } from "@shared/icons/icons.component"

interface StatCard {
  label: string
  value: number
  sub: string
}

@Component({
  selector: "admin-documents-page",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: "./admin-documents.page.html",
})
export class AdminDocumentsPage implements OnInit, OnDestroy {
  private dashboardService = inject(AdminDashboardService)
  private documentService = inject(DocumentService)
  protected Math = Math

  documents: AdminDocument[] = []
  totalDocuments = 0
  totalSigned = 0
  totalPending = 0
  totalSystemVerifications = 0
  currentPage = 1
  pageSize = 10
  isLoading = true

  searchQuery = ""
  statusFilter = "all"
  private searchSubject = new Subject<string>()
  private searchSubscription!: Subscription

  showConfirmModal = false
  confirmActionType: "download" | "delete" = "download"
  selectedDoc: AdminDocument | null = null

  ngOnInit() {
    this.loadDocuments()
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery = query
        this.currentPage = 1
        this.loadDocuments()
      })
  }

  ngOnDestroy() {
    if (this.searchSubscription) this.searchSubscription.unsubscribe()
  }

  get statCards(): StatCard[] {
    return [
      { label: "Total Documents", value: this.totalDocuments, sub: "All time records" },
      { label: "Cryptographically Signed", value: this.totalSigned, sub: "Successfully signed" },
      { label: "Awaiting Action", value: this.totalPending, sub: "Pending or unsigned" },
      {
        label: "Total Verifications",
        value: this.totalSystemVerifications,
        sub: "System-wide checks",
      },
    ]
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value
    this.searchSubject.next(value)
  }

  onFilterChange() {
    this.currentPage = 1
    this.loadDocuments()
  }

  loadDocuments(page: number = this.currentPage) {
    this.isLoading = true
    this.dashboardService.getAdminDocuments(page, this.searchQuery, this.statusFilter).subscribe({
      next: (response) => {
        this.documents = response.results
        this.totalDocuments = response.count
        this.totalSigned = response.total_signed
        this.totalPending = response.total_pending
        this.totalSystemVerifications = response.total_system_verifications
        this.currentPage = page
        this.isLoading = false
      },
      error: (err) => {
        console.error("Failed to load documents", err)
        this.isLoading = false
      },
    })
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.totalDocuments)
      this.loadDocuments(this.currentPage + 1)
  }

  prevPage() {
    if (this.currentPage > 1) this.loadDocuments(this.currentPage - 1)
  }

  openConfirmModal(action: "download" | "delete", doc: AdminDocument) {
    this.confirmActionType = action
    this.selectedDoc = doc
    this.showConfirmModal = true
  }

  closeConfirmModal() {
    this.showConfirmModal = false
    this.selectedDoc = null
  }

  executeConfirmAction() {
    if (!this.selectedDoc) return
    const docId = this.selectedDoc.id
    let docName = this.selectedDoc.name
    const ext = this.getDocType(this.selectedDoc)

    if (ext !== "Unknown" && !docName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
      docName = `${docName}.${ext}`
    }

    if (this.confirmActionType === "download") {
      this.dashboardService.downloadAdminDocument(docId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = docName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        },
        error: (err) => console.error("Download failed", err),
      })
    } else if (this.confirmActionType === "delete") {
      this.dashboardService.deleteAdminDocument(docId).subscribe({
        next: () => this.loadDocuments(this.currentPage),
        error: (err) => console.error("Deletion failed", err),
      })
    }
    this.closeConfirmModal()
  }

  getDocType(doc: AdminDocument): string {
    if (doc.file_type) {
      return doc.file_type.split(".").pop() ?? "Unknown"
    }
    return "Unknown"
  }
}
