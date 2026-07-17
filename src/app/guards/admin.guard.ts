import { inject, PLATFORM_ID } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { CanActivateFn, Router } from "@angular/router"
import { AuthService } from "@services/auth.service"

export const adminGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID)
  if (!isPlatformBrowser(platformId)) return true

  const authService = inject(AuthService)
  const router = inject(Router)

  const user = authService.currentUser
  if (authService.isAuthenticated && user?.is_staff) {
    return true
  }

  return router.createUrlTree(["/dashboard/overview"])
}
