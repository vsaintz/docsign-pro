import { Injectable, PLATFORM_ID, Inject } from "@angular/core"
import { Observable, of } from "rxjs"
import { isPlatformBrowser } from "@angular/common"
import { HttpClient } from "@angular/common/http"

import { environment } from "@environments/environment"

export interface SignatureResponse {
  message: string
  signature_id: string
  status: string
}

export interface VerificationResponse {
  status: "verified" | "tampered" | "unsigned"
  signed_by?: string
  signed_at?: string
}

@Injectable({ providedIn: "root" })
export class SignatureService {
  private baseUrl = `${environment.apiUrl}/signatures`
  private isBrowser: boolean

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId)
  }

  signDocument(documentId: string): Observable<SignatureResponse> {
    if (!this.isBrowser) return of({} as SignatureResponse)
    return this.http.post<SignatureResponse>(`${this.baseUrl}/${documentId}/sign/`, {})
  }

  verifyDocument(documentId: string): Observable<VerificationResponse> {
    if (!this.isBrowser) return of({ status: "unsigned" } as VerificationResponse)
    return this.http.get<VerificationResponse>(`${this.baseUrl}/${documentId}/verify/`)
  }
}
