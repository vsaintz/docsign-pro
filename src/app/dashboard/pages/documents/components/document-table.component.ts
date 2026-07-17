import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  HostListener,
  ElementRef,
} from "@angular/core"
import { DatePipe } from "@angular/common"
import { Document } from "@services/document.service"
import { IconComponent } from "@shared/icons/icons.component"

@Component({
  selector: "document-table",
  standalone: true,
  imports: [DatePipe, IconComponent],
  templateUrl: "./document-table.component.html",
})
export class DocumentTableComponent {
  @Input() documents: Document[] = []
  @Input() selectedIds = new Set<string>()
  @Input() signingInProgress = new Set<string>()
  @Output() toggleOne = new EventEmitter<string>()
  @Output() toggleAll = new EventEmitter<void>()
  @Output() signDocument = new EventEmitter<string>()
  @Output() verifyDocument = new EventEmitter<string>()
  @Output() deleteDocument = new EventEmitter<string>()
  @Output() downloadDocument = new EventEmitter<string>()
  @Output() viewDocument = new EventEmitter<string>()
  activeMenu = signal<string | null>(null)
  menuPosition = signal<{ top: number; left: number } | null>(null)
  copiedId = signal<string | null>(null)

  private readonly MENU_WIDTH = 176
  private readonly MENU_HEIGHT_ESTIMATE = 190

  constructor(private elRef: ElementRef) {}

  @HostListener("document:click")
  onDocClick() {
    this.closeMenu()
  }

  @HostListener("window:scroll")
  @HostListener("window:resize")
  onViewportChange() {
    this.closeMenu()
  }

  toggleMenu(id: string, e: MouseEvent) {
    e.stopPropagation()
    if (this.activeMenu() === id) {
      this.closeMenu()
      return
    }
    const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const spaceBelow = window.innerHeight - btnRect.bottom
    const openUpward = spaceBelow < this.MENU_HEIGHT_ESTIMATE
    const top = openUpward ? btnRect.top - this.MENU_HEIGHT_ESTIMATE - 4 : btnRect.bottom + 4
    const left = Math.min(btnRect.right - this.MENU_WIDTH, window.innerWidth - this.MENU_WIDTH - 8)
    this.menuPosition.set({ top, left })
    this.activeMenu.set(id)
  }

  closeMenu() {
    this.activeMenu.set(null)
    this.menuPosition.set(null)
  }

  getDoc(id: string): Document | undefined {
    return this.documents.find((d) => d.id === id)
  }

  onDeleteClick(id: string, e: MouseEvent) {
    e.stopPropagation()
    this.closeMenu()
    this.deleteDocument.emit(id)
  }
  onDownloadClick(id: string, e: MouseEvent) {
    e.stopPropagation()
    this.closeMenu()
    this.downloadDocument.emit(id)
  }
  onViewClick(id: string, e: MouseEvent) {
    e.stopPropagation()
    this.closeMenu()
    this.viewDocument.emit(id)
  }
  onSignClick(id: string, e: MouseEvent) {
    e.stopPropagation()
    this.closeMenu()
    this.signDocument.emit(id)
  }
  onVerifyClick(id: string, e: MouseEvent) {
    e.stopPropagation()
    this.closeMenu()
    this.verifyDocument.emit(id)
  }
  get isAllSelected(): boolean {
    return this.documents.length > 0 && this.selectedIds.size === this.documents.length
  }
  get isIndeterminate(): boolean {
    return this.selectedIds.size > 0 && this.selectedIds.size < this.documents.length
  }
  fileTypeBg(ext: string): string {
    return "bg-background-subtle text-foreground border border-border"
  }
  statusBg(status: string): string {
    switch (status) {
      case "ready":
        return "bg-[oklch(0.96_0.01_240)] text-[oklch(0.40_0.07_240)]"
      case "error":
        return "bg-[oklch(0.96_0.04_25)] text-[oklch(0.45_0.18_25)]"
      case "processing":
        return "bg-[oklch(0.96_0.04_40)] text-[oklch(0.45_0.18_40)]"
      default:
        return "bg-[oklch(0.96_0.01_240)] text-[oklch(0.40_0.07_240)]"
    }
  }
  signingBg(status: string): string {
    if (status === "signed") {
      return "bg-[oklch(0.96_0.04_355)] text-[oklch(0.45_0.16_355)]"
    }
    return "bg-[oklch(0.96_0.02_80)] text-[oklch(0.45_0.06_80)]"
  }
  copyToClipboard(id: string, e: MouseEvent) {
    e.stopPropagation()
    navigator.clipboard
      .writeText(id)
      .then(() => {
        this.copiedId.set(id)
        setTimeout(() => {
          if (this.copiedId() === id) {
            this.copiedId.set(null)
          }
        }, 3000)
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
      })
  }
  getDocType(doc: Document): string {
    if (doc.file_type) {
      return doc.file_type.split(".").pop() ?? "unk"
    }
    return "unk"
  }
}
