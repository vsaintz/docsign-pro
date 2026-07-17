import { inject } from "@angular/core"
import { Router, Routes } from "@angular/router"

import { authGuard } from "@guards/auth.guard"
import { guestGuard } from "@guards/guest.guard"
import { adminGuard } from "@guards/admin.guard"

import { AuthService } from "@services/auth.service"

import { SigninComponent } from "@auth/signin/signin.component"
import { SignupComponent } from "@auth/signup/signup.component"
import { DocumentVerifyComponent } from "@verification/document-verify.component"
import { LandingComponent } from "@landing/landing.component"
import { DashboardComponent } from "@dashboard/dashboard.component"

import { OverviewPage } from "@dashboard/pages/overview/overview.page"
import { ProjectsPage } from "@dashboard/pages/projects/projects.page"
import { DocumentsPage } from "@dashboard/pages/documents/documents.page"

import { AdminOverviewPage } from "@dashboard/pages/admin/overview/admin-overview.page"
import { AdminDocumentsPage } from "@dashboard/pages/admin/documents/admin-documents.page"
import { AdminUsersPage } from "@dashboard/pages/admin/users/admin-users.page"
import { AdminAuditPage } from "@dashboard/pages/admin/audit/admin-audit.page"

import { ComingSoonComponent } from "@shared/components/coming-soon.component"

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/landing",
    pathMatch: "full",
  },
  {
    path: "verification",
    component: DocumentVerifyComponent,
  },
  {
    path: "comingsoon",
    component: ComingSoonComponent,
  },
  {
    path: "auth",
    canActivate: [guestGuard],
    children: [
      { path: "signin", component: SigninComponent },
      { path: "signup", component: SignupComponent },
    ],
  },
  {
    path: "landing",
    component: LandingComponent,
  },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "",
        pathMatch: "full",
        children: [],
        canActivate: [
          () => {
            const authService = inject(AuthService)
            const router = inject(Router)

            if (authService.currentUser?.is_staff) {
              return router.createUrlTree(["/dashboard/admin/overview"])
            }
            return router.createUrlTree(["/dashboard/overview"])
          },
        ],
      },
      {
        path: "admin",
        canActivate: [adminGuard],
        children: [
          { path: "", redirectTo: "overview", pathMatch: "full" },
          { path: "overview", component: AdminOverviewPage },
          { path: "documents", component: AdminDocumentsPage },
          { path: "users", component: AdminUsersPage },
          { path: "audit", component: AdminAuditPage },
        ],
      },
      {
        path: "overview",
        component: OverviewPage,
      },
      {
        path: "projects",
        component: ProjectsPage,
      },
      {
        path: "documents",
        component: DocumentsPage,
      },
    ],
  },
]
