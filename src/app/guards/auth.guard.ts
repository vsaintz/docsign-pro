import { inject, PLATFORM_ID } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { CanActivateFn, Router } from "@angular/router"
import { AuthService } from "@services/auth.service"

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID)
  if (!isPlatformBrowser(platformId)) return true

  const authService = inject(AuthService)
  const router = inject(Router)

  if (authService.isAuthenticated) return true

  authService.clearSession()
  return router.createUrlTree(["/auth/signin"])
}
