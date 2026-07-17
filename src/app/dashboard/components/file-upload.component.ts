import {
  Component,
  signal,
  ViewChild,
  ElementRef,
  inject,
  Output,
  EventEmitter,
} from "@angular/core"
import { DecimalPipe } from "@angular/common"
import { finalize } from "rxjs"
import { DocumentService } from "@services/document.service"
import { IconComponent } from "@shared/icons/icons.component"

const ALLOWED_EXTENSIONS = [".csv", ".xls", ".xlsx"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

@Component({
  selector: "dash-file-upload",
  standalone: true,
  imports: [DecimalPipe, IconComponent],
  templateUrl: "./file-upload.component.html",
})
export class FileUploadComponent {
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>
  @Output() uploadSuccess = new EventEmitter<void>()
  private documentService = inject(DocumentService)

  selectedFile = signal<File | null>(null)
  isDragging = signal(false)
  isUploading = signal(false)
  errorMessage = signal<string | null>(null)

  onDropZoneClick(event: MouseEvent) {
    if (!this.selectedFile()) {
      this.fileInput.nativeElement.click()
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) this.handleFile(file)
  }

  onDragOver(event: DragEvent) {
    event.preventDefault()
    this.isDragging.set(true)
  }

  onDragLeave() {
    this.isDragging.set(false)
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    this.isDragging.set(false)
    const file = event.dataTransfer?.files[0]
    if (file) this.handleFile(file)
  }

  private handleFile(file: File) {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      this.errorMessage.set(
        `"${extension || "unknown"}" isn't supported. Upload a CSV, XLS, or XLSX file.`,
      )
      this.fileInput.nativeElement.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      this.errorMessage.set(`That file is ${sizeMb}MB. The limit is 10MB.`)
      this.fileInput.nativeElement.value = ""
      return
    }

    this.selectedFile.set(file)
    this.errorMessage.set(null)
  }

  discardFile() {
    this.selectedFile.set(null)
    this.fileInput.nativeElement.value = ""
    this.errorMessage.set(null)
  }

  confirmUpload() {
    const file = this.selectedFile()
    if (!file) return
    this.isUploading.set(true)
    this.errorMessage.set(null)

    this.documentService
      .uploadDocument(file)
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: () => {
          this.discardFile()
          this.uploadSuccess.emit()
        },
        error: (err) => {
          this.errorMessage.set(this.resolveErrorMessage(err))
        },
      })
  }

  private resolveErrorMessage(err: any): string {
    if (err?.error?.detail) return err.error.detail
    if (err?.status === 0) return "Couldn't reach the server. Check your connection and try again."
    if (err?.status === 413) return "This file is too large for the server to accept."
    if (err?.status === 415) return "The server rejected this file type."
    if (err?.status >= 500) return "Something went wrong on our end. Try again in a moment."
    return "Upload failed. Please try again."
  }
}
