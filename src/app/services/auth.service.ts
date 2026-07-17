import { Injectable, PLATFORM_ID, Inject } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { HttpClient } from "@angular/common/http"
import { BehaviorSubject, Observable, map, tap, switchMap, finalize } from "rxjs"
import { environment } from "@environments/environment"

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone_number?: string
  is_staff?: boolean
  is_active?: boolean
  date_joined?: string
  last_login?: string
  document_count?: number
}

interface TokenPair {
  access: string
  refresh: string
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private currentUser$ = new BehaviorSubject<User | null>(null)
  private isBrowser: boolean

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId)
    this.loadUserFromStorage()
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) return
    const stored = localStorage.getItem("user")
    if (stored) {
      this.currentUser$.next(JSON.parse(stored))
    }
  }

  signup(payload: {
    email: string
    password: string
    first_name: string
    middle_name: string
    last_name: string
    phone_number: string
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/users/auth/register/`, payload)
  }

  signin(payload: { email: string; password: string }): Observable<User> {
    return this.http.post<TokenPair>(`${environment.apiUrl}/users/auth/login/`, payload).pipe(
      tap((tokens) => {
        if (!this.isBrowser) return
        localStorage.setItem("access_token", tokens.access)
        localStorage.setItem("refresh_token", tokens.refresh)
      }),
      switchMap(() => this.fetchAndStoreUser()),
    )
  }

  private fetchAndStoreUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/auth/me/`).pipe(
      tap((user) => {
        if (!this.isBrowser) return
        localStorage.setItem("user", JSON.stringify(user))
        this.currentUser$.next(user)
      }),
    )
  }

  clearSession(): void {
    if (this.isBrowser) {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
    }
    this.currentUser$.next(null)
  }

  signout(): Observable<void> {
    const refresh = this.isBrowser ? localStorage.getItem("refresh_token") : null
    return this.http.post(`${environment.apiUrl}/users/auth/logout/`, { refresh }).pipe(
      finalize(() => this.clearSession()),
      map(() => void 0),
    )
  }

  refreshToken(): Observable<string> {
    const refresh = this.isBrowser ? localStorage.getItem("refresh_token") : null
    return this.http
      .post<{ access: string }>(`${environment.apiUrl}/users/auth/refresh/`, { refresh })
      .pipe(
        tap((data) => {
          if (!this.isBrowser) return
          localStorage.setItem("access_token", data.access)
        }),
        map((data) => data.access),
      )
  }

  getAccessToken(): string | null {
    return this.isBrowser ? localStorage.getItem("access_token") : null
  }

  isTokenExpired(): boolean {
    const token = this.getAccessToken()
    if (!token) return true
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  get isAuthenticated(): boolean {
    return this.isBrowser ? !!localStorage.getItem("refresh_token") : false
  }

  get currentUser(): User | null {
    return this.currentUser$.value
  }

  get user$(): Observable<User | null> {
    return this.currentUser$.asObservable()
  }
}
