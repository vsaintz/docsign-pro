import { Injectable, PLATFORM_ID, Inject } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { HttpClient } from "@angular/common/http"
import { Observable, of } from "rxjs"
import { HttpParams } from "@angular/common/http"

import { User } from "@services/auth.service"
import { environment } from "@environments/environment"

export interface AdminDashboardData {
  totalDocuments: number
  totalUsers: number
  activeUsers7d: number
  storageUsedBytes: number
  pendingOrgWide: number
  statusSegments: any[]
  orgDocs: any[]
  auditEvents: any[]
  activityData: any[]
}

export interface PaginatedUsers {
  count: number
  total_active: number
  total_staff: number
  activeUsers7d: number
  next: string | null
  previous: string | null
  results: User[]
}

export interface AdminDocument {
  id: string
  name: string
  file_type: string
  file_size: string
  status: string
  owner_email: string
  created_at: string
  signed_by: string | null
  signed_at: string | null
  verification_id: string | null
  total_verifications: number
  successful_verifications: number
  failed_verifications: number
}

export interface PaginatedDocuments {
  count: number
  total_signed: number
  total_pending: number
  total_system_verifications: number
  next: string | null
  previous: string | null
  results: AdminDocument[]
}

export interface AuditLogEntry {
  id: string
  event_type: string
  document_name: string
  actor: string
  ip_address: string
  user_agent: string
  timestamp: string
  status: string
}

export interface PaginatedAuditLogs {
  count: number
  next: string | null
  previous: string | null
  results: AuditLogEntry[]
}

@Injectable({ providedIn: "root" })
export class AdminDashboardService {
  private baseUrl = `${environment.apiUrl}/documents/admin-overview`
  private isBrowser: boolean

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId)
  }

  getAdminOverview(): Observable<AdminDashboardData | null> {
    if (!this.isBrowser) return of(null)
    return this.http.get<AdminDashboardData>(this.baseUrl)
  }

  getAdminUsers(
    page: number = 1,
    search: string = "",
    role: string = "all",
    status: string = "all",
  ): Observable<PaginatedUsers> {
    let params = new HttpParams().set("page", page)
    if (search) params = params.set("search", search)
    if (role !== "all") params = params.set("role", role)
    if (status !== "all") params = params.set("status", status)

    return this.http.get<PaginatedUsers>(`${environment.apiUrl}/users/admin/list/`, { params })
  }

  toggleUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.post(`${environment.apiUrl}/users/admin/${userId}/toggle-status/`, {
      is_active: isActive,
    })
  }

  getAdminDocuments(
    page: number = 1,
    search: string = "",
    status: string = "all",
  ): Observable<PaginatedDocuments> {
    let params = new HttpParams().set("page", page)
    if (search) params = params.set("search", search)
    if (status !== "all") params = params.set("status", status)

    return this.http.get<PaginatedDocuments>(`${environment.apiUrl}/documents/admin/list/`, {
      params,
    })
  }

  deleteAdminDocument(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/documents/admin/${id}/`)
  }

  downloadAdminDocument(id: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/documents/admin/${id}/download/`, {
      responseType: "blob",
    })
  }

  getAdminAuditLogs(page: number = 1): Observable<PaginatedAuditLogs> {
    return this.http.get<PaginatedAuditLogs>(
      `${environment.apiUrl}/documents/admin/audit/?page=${page}`,
    )
  }
}
