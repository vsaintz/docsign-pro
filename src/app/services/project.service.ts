import { Injectable, PLATFORM_ID, Inject } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { HttpClient } from "@angular/common/http"
import { Observable, of, EMPTY } from "rxjs"

import { environment } from "@environments/environment"

export interface ProjectDTO {
  id: string
  name: string
  color: string
  pinned: boolean
  doc_count: number
  created_at: string
  updated_at: string
}

@Injectable({ providedIn: "root" })
export class ProjectService {
  private baseUrl = `${environment.apiUrl}/projects`
  private isBrowser: boolean

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId)
  }

  private guard<T>(fn: () => Observable<T>): Observable<T> {
    return this.isBrowser ? fn() : EMPTY
  }

  list(): Observable<ProjectDTO[]> {
    return this.isBrowser ? this.http.get<ProjectDTO[]>(`${this.baseUrl}/`) : of([])
  }

  create(payload: { name: string; color: string }): Observable<ProjectDTO> {
    return this.guard(() => this.http.post<ProjectDTO>(`${this.baseUrl}/`, payload))
  }

  update(
    id: string,
    payload: Partial<Pick<ProjectDTO, "name" | "color" | "pinned">>,
  ): Observable<ProjectDTO> {
    return this.guard(() => this.http.patch<ProjectDTO>(`${this.baseUrl}/${id}/`, payload))
  }

  delete(id: string): Observable<void> {
    return this.guard(() => this.http.delete<void>(`${this.baseUrl}/${id}/`))
  }

  addDocument(projectId: string, documentId: string): Observable<{ status: string }> {
    return this.guard(() =>
      this.http.patch<{ status: string }>(`${this.baseUrl}/${projectId}/add-document/`, {
        document_id: documentId,
      }),
    )
  }

  removeDocument(documentId: string): Observable<{ status: string }> {
    return this.guard(() =>
      this.http.patch<{ status: string }>(`${this.baseUrl}/remove-document/${documentId}/`, {}),
    )
  }
}
