import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from "@angular/common/http"
import { inject, PLATFORM_ID } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { Router } from "@angular/router"
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, finalize } from "rxjs"
import { AuthService } from "@services/auth.service"
let isRefreshing = false
const refreshTokenSubject = new BehaviorSubject<string | null>(null)

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID)
  if (!isPlatformBrowser(platformId)) return next(req)

  const authService = inject(AuthService)
  const router = inject(Router)

  if (req.url.includes("/auth/refresh")) {
    return next(req)
  }

  const token = authService.getAccessToken()
  const authReq = token ? addToken(req, token) : req

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401(req, next, authService, router)
      }
      return throwError(() => error)
    }),
  )
}

function addToken(req: HttpRequest<unknown>, token: string) {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  })
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
) {
  if (!isRefreshing) {
    isRefreshing = true
    refreshTokenSubject.next(null)

    return authService.refreshToken().pipe(
      catchError((err) => {
        authService.clearSession()
        router.navigate(["/auth/signin"])
        return throwError(() => err)
      }),
      switchMap((newToken: string) => {
        refreshTokenSubject.next(newToken)
        return next(addToken(req, newToken))
      }),
      finalize(() => {
        isRefreshing = false
      }),
    )
  } else {
    return refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next(addToken(req, token))),
    )
  }
}
