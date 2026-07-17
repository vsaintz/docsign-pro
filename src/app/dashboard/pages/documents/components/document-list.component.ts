import {
  Component,
  afterNextRender,
  inject,
  ChangeDetectorRef,
  signal,
  computed,
} from "@angular/core"
import { forkJoin } from "rxjs"
import { DocumentService, Document, DocumentStats } from "@services/document.service"
import { SignatureService, VerificationResponse } from "@services/signature.service"
import { ToastService } from "@services/toast.service"

import { IconComponent } from "@shared/icons/icons.component"
import { SvgEmptyStateComponent } from "@shared/icons/svg-emptystate-icon.component"

import { DocumentToolbarComponent, FilterStatus, SortField } from "./document-toolbar.component"
import { StatsCardComponent } from "./stats-card.component"
import { DocumentTableComponent } from "./document-table.component"
import { VerificationModalComponent } from "./verification-modal.component"
import { DocumentViewModalComponent } from "./document-view-modal.component"
import { DeleteConfirmDialogComponent } from "./delete-confirm-dialog.component"

const PAGE_SIZE = 10

@Component({
  selector: "list-document",
  standalone: true,
  imports: [
    StatsCardComponent,
    DocumentToolbarComponent,
    DocumentTableComponent,
    IconComponent,
    SvgEmptyStateComponent,
    DocumentViewModalComponent,
    VerificationModalComponent,
    DeleteConfirmDialogComponent,
  ],
  templateUrl: "./document-list.component.html",
})
export class ListDocumentComponent {
  documentStats = signal<DocumentStats | null>(null)
  allDocuments = signal<Document[]>([])
  isLoading = signal(true)
  showVerificationModal = signal(false)
  isVerifying = signal(false)
  verificationResult = signal<VerificationResponse | null>(null)

  private toastService = inject(ToastService)

  showViewModal = signal(false)
  viewModalLoading = signal(false)
  viewDocumentData = signal<any>(null)
  viewDocumentName = signal("")

  pendingDeleteCount = signal(0)
  pendingDeleteId = signal<string | null>(null)
  pendingDeleteName = signal("")

  private signatureService = inject(SignatureService)
  private cdr = inject(ChangeDetectorRef)
  private documentService = inject(DocumentService)

  signingInProgress = signal<Set<string>>(new Set())

  selectedIds = new Set<string>()

  searchQuery = signal("")
  activeFilter = signal<FilterStatus>("all")
  sortField = signal<SortField>("date")

  currentPage = signal(1)

  filteredDocs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    const filter = this.activeFilter()
    const sort = this.sortField()

    let list = [...this.allDocuments()]

    if (q) list = list.filter((d) => d.name.toLowerCase().includes(q))

    if (filter !== "all") {
      list = list.filter((d) => {
        if (filter === "signed" || filter === "unsigned") return d.signing_status == filter
        return d.processing_status == filter
      })
    }

    list.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name)
        case "size":
          return (b.file_size ?? 0) - (a.file_size ?? 0)
        case "status":
          return a.processing_status.localeCompare(b.processing_status)
        case "signature":
          return (a.signing_status || "").localeCompare(b.signing_status || "")
        case "date":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return list
  })

  paginatedDocs = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE
    return this.filteredDocs().slice(start, start + PAGE_SIZE)
  })

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredDocs().length / PAGE_SIZE)))

  pageNumbers = computed(() => {
    const total = this.totalPages()
    const cur = this.currentPage()
    const range: number[] = []
    const delta = 2
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
      range.push(i)
    }
    return range
  })

  get selectedCount(): number {
    return this.selectedIds.size
  }

  constructor() {
    afterNextRender(() => this.loadDocuments())
  }

  loadDocuments(): void {
    this.isLoading.set(true)
    this.documentService.getDocuments().subscribe({
      next: (data) => {
        this.allDocuments.set(data)
        this.isLoading.set(false)
        this.cdr.detectChanges()
      },
      error: () => {
        this.isLoading.set(false)
        this.toastService.error("Failed to load documents.")
        this.cdr.detectChanges()
      },
    })
    this.documentService.getDocumentStats().subscribe({
      next: (stats) => this.documentStats.set(stats),
      error: () => this.toastService.error("Failed to load document stats."),
    })
  }

  onDownloadDocument(id: string) {
    const doc = this.allDocuments().find((d) => d.id === id)
    if (doc) {
      let fileName = doc.name
      const ext = `.${doc.file_type}`
      if (!fileName.toLowerCase().endsWith(ext.toLowerCase())) {
        fileName = `${fileName}${ext}`
      }
      this.documentService.downloadDocument(id, fileName)
    }
  }

  onDownloadSelected() {
    this.selectedIds.forEach((id) => this.onDownloadDocument(id))
    this.clearSelection()
  }

  onDeleteDocument(id: string) {
    const doc = this.allDocuments().find((d) => d.id === id)
    this.pendingDeleteId.set(id)
    this.pendingDeleteName.set(doc?.name ?? "")
    this.pendingDeleteCount.set(1)
  }

  onDeleteSelected() {
    if (this.selectedIds.size === 0) return
    this.pendingDeleteId.set(null)
    this.pendingDeleteName.set("")
    this.pendingDeleteCount.set(this.selectedIds.size)
  }

  onDeleteConfirmed() {
    const singleId = this.pendingDeleteId()
    this.pendingDeleteCount.set(0)

    if (singleId) {
      this.documentService.deleteDocument(singleId).subscribe({
        next: () => {
          this.selectedIds.delete(singleId)
          this.toastService.success("Document deleted.")
          this.loadDocuments()
        },
        error: (err) => {
          this.toastService.error(err.error?.detail ?? "Failed to delete document.")
        },
      })
    } else {
      const deleteRequests = Array.from(this.selectedIds).map((id) =>
        this.documentService.deleteDocument(id),
      )
      forkJoin(deleteRequests).subscribe({
        next: () => {
          this.toastService.success("Documents deleted.")
          this.clearSelection()
          this.loadDocuments()
        },
        error: () => {
          this.toastService.error("Some documents could not be deleted.")
          this.loadDocuments()
        },
      })
    }
  }

  onDeleteCancelled() {
    this.pendingDeleteCount.set(0)
    this.pendingDeleteId.set(null)
    this.pendingDeleteName.set("")
  }

  onViewDocument(id: string) {
    const doc = this.allDocuments().find((d) => d.id === id)
    if (!doc) return

    this.viewDocumentName.set(doc.name)
    this.viewDocumentData.set(null)
    this.viewModalLoading.set(true)
    this.showViewModal.set(true)

    this.documentService.getDocumentData(id).subscribe({
      next: (res) => {
        this.viewDocumentData.set(res)
        this.viewModalLoading.set(false)
      },
      error: (err) => {
        this.toastService.error(err.error?.detail ?? "Failed to load document data.")
        this.viewModalLoading.set(false)
      },
    })
  }

  closeViewModal() {
    this.showViewModal.set(false)
  }

  onSignDocument(id: string): void {
    this.signingInProgress.update((set) => {
      const newSet = new Set(set)
      newSet.add(id)
      return newSet
    })

    this.signatureService.signDocument(id).subscribe({
      next: (res) => {
        this.toastService.success(res.message ?? "Document signed successfully.")
        this.loadDocuments()
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? "Failed to sign document.")
      },
      complete: () => {
        this.signingInProgress.update((set) => {
          const newSet = new Set(set)
          newSet.delete(id)
          return newSet
        })
      },
    })
  }

  onVerifyDocument(id: string): void {
    this.showVerificationModal.set(true)
    this.isVerifying.set(true)
    this.verificationResult.set(null)

    this.signatureService.verifyDocument(id).subscribe({
      next: (res) => {
        this.verificationResult.set(res)
        this.isVerifying.set(false)
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? "Failed to verify document.")
        this.verificationResult.set({ status: "tampered" })
        this.isVerifying.set(false)
      },
    })
  }

  closeVerificationModal() {
    this.showVerificationModal.set(false)
    setTimeout(() => this.verificationResult.set(null), 200)
  }

  visibleEndCount = computed(() => {
    return Math.min(this.currentPage() * 10, this.filteredDocs().length)
  })

  toggleAll(): void {
    const pageDocs = this.paginatedDocs()
    const allSelected = pageDocs.every((d) => this.selectedIds.has(d.id))
    if (allSelected) pageDocs.forEach((d) => this.selectedIds.delete(d.id))
    else pageDocs.forEach((d) => this.selectedIds.add(d.id))
  }

  toggleOne(id: string): void {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id)
  }

  clearSelection(): void {
    this.selectedIds.clear()
  }

  onSearchChange(q: string): void {
    this.searchQuery.set(q)
    this.currentPage.set(1)
  }

  onFilterChange(f: FilterStatus): void {
    this.activeFilter.set(f)
    this.currentPage.set(1)
    this.clearSelection()
  }

  onSortChange(s: SortField): void {
    this.sortField.set(s)
    this.currentPage.set(1)
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return
    this.currentPage.set(page)
    this.clearSelection()
  }
}
