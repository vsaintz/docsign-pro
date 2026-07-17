import { Component, ElementRef, ViewChild, signal } from "@angular/core"
import { DatePipe } from "@angular/common"
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms"
import { HttpClient } from "@angular/common/http"
import { environment } from "@environments/environment"
import { IconComponent } from "@shared/icons/icons.component"
import { SvgSitelogoComponent } from "@shared/icons/svg-sitelogo.component"

interface VerificationResult {
  status: "verified" | "tampered" | "not_found" | "error"
  signed_by?: string
  signed_at?: string
  error?: string
}

@Component({
  selector: "app-document-verify",
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, SvgSitelogoComponent, DatePipe],
  templateUrl: "./document-verify.component.html",
})
export class DocumentVerifyComponent {
  @ViewChild("fileInput") fileInputRef!: ElementRef<HTMLInputElement>

  signatureId = new FormControl("", [Validators.maxLength(8), Validators.pattern(/^[0-9A-Fa-f]*$/)])

  selectedFile: File | null = null
  isDragging = false

  isVerifying = signal(false)
  verificationResult = signal<VerificationResult | null>(null)

  constructor(private http: HttpClient) {}

  get characterCount(): number {
    return this.signatureId.value?.length || 0
  }

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click()
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files?.length) {
      this.handleFile(input.files[0])
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault()
    this.isDragging = true
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault()
    this.isDragging = false
  }

  onDrop(event: DragEvent): void {
    event.preventDefault()
    this.isDragging = false
    if (event.dataTransfer?.files?.length) {
      this.handleFile(event.dataTransfer.files[0])
    }
  }

  private handleFile(file: File): void {
    const validExtensions = [".csv", ".xls", ".xlsx"]
    const isValid = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (isValid) {
      this.selectedFile = file
      this.verificationResult.set(null)
    } else {
      console.warn("Invalid file type selected.")
    }
  }

  verifyDocument(): void {
    if (!this.selectedFile || this.characterCount !== 8 || !this.signatureId.value) {
      return
    }

    this.isVerifying.set(true)
    this.verificationResult.set(null)

    const formData = new FormData()
    formData.append("short_id", this.signatureId.value)
    formData.append("file", this.selectedFile)

    this.http
      .post<VerificationResult>(`${environment.apiUrl}/signatures/public-verify/`, formData)
      .subscribe({
        next: (response) => {
          this.isVerifying.set(false)
          this.verificationResult.set(response)
        },
        error: (err) => {
          this.isVerifying.set(false)
          this.verificationResult.set({
            status: "error",
            error: err.error?.error || "An unexpected error occurred during verification.",
          })
        },
      })
  }
}
