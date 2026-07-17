import { Injectable, PLATFORM_ID, Inject } from "@angular/core"
import { Observable, of } from "rxjs"
import { isPlatformBrowser } from "@angular/common"
import { HttpClient } from "@angular/common/http"

import { environment } from "@environments/environment"

export interface DocumentStats {
  total_documents: number
  signed_documents: number
  unsigned_documents: number
  total_storage_bytes: number
}

export interface Document {
  id: string
  verification_id?: string | null
  name: string
  owner_email: string
  file_size: number
  file_size_display: string
  file_type: string
  processing_status: string
  signing_status: string
  created_at: string
  column_count?: number
  row_count?: number
  project?: string | null
}

export interface DocumentUploadResponse {
  id: string
  file_name: string
  file_type: string
  uploaded_at: string
}

@Injectable({ providedIn: "root" })
export class DocumentService {
  private baseUrl = `${environment.apiUrl}/documents`
  private isBrowser: boolean

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId)
  }

  getDocumentStats(): Observable<DocumentStats> {
    if (!this.isBrowser)
      return of({
        total_documents: 0,
        signed_documents: 0,
        unsigned_documents: 0,
        total_storage_bytes: 0,
      })
    return this.http.get<DocumentStats>(`${this.baseUrl}/stats/`)
  }

  getDocuments(): Observable<Document[]> {
    if (!this.isBrowser) return of([])
    return this.http.get<Document[]>(`${this.baseUrl}/`)
  }

  uploadDocument(file: File): Observable<DocumentUploadResponse> {
    if (!this.isBrowser) return of(null as any)
    const formData = new FormData()
    formData.append("file", file)
    return this.http.post<DocumentUploadResponse>(`${this.baseUrl}/`, formData)
  }

  deleteDocument(id: string): Observable<any> {
    if (!this.isBrowser) return of(null)
    return this.http.delete(`${this.baseUrl}/${id}/`)
  }

  downloadDocument(id: string, fileName: string = "document"): void {
    if (!this.isBrowser) return

    this.http.get(`${this.baseUrl}/${id}/download/`, { responseType: "blob" }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()

        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      },
      error: (err) => console.error("Download failed", err),
    })
  }
  getDocumentData(id: string): Observable<any> {
    if (!this.isBrowser) return of(null)
    return this.http.get(`${this.baseUrl}/${id}/data/`)
  }

  exportAllDocuments(): void {
    if (!this.isBrowser) return

    this.http.get(`${this.baseUrl}/export/`, { responseType: "blob" }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "my_documents.zip"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      },
      error: (err) => console.error("Export failed", err),
    })
  }
}
