import { Component, signal, HostListener, ElementRef, inject, OnDestroy } from "@angular/core"
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from "@angular/router"
import { AsyncPipe } from "@angular/common"
import { filter, Subscription } from "rxjs"

import { AuthService } from "@services/auth.service"
import { ModalStateService } from "@services/modal-state.service"

import { AppIconName } from "@shared/icons/icons"
import { IconComponent } from "@shared/icons/icons.component"
import { SvgSitelogoComponent } from "@shared/icons/svg-sitelogo.component"

interface NavItem {
  title: string
  path: string
  icon: AppIconName
}

@Component({
  selector: "dash-sidebar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, AsyncPipe, SvgSitelogoComponent],
  templateUrl: "./sidebar.component.html",
})
export class SidebarComponent implements OnDestroy {
  private authService = inject(AuthService)
  private modalStateService = inject(ModalStateService)

  showCreateModal = signal(false)
  showUserPopover = signal(false)
  mobileOpen = signal(false)
  isAdminView = signal(false)

  user$ = this.authService.user$
  private routerSub: Subscription

  mainNav: NavItem[] = [
    { title: "Overview", path: "overview", icon: "LayoutGrid" },
    { title: "Projects", path: "projects", icon: "Presentation" },
    { title: "My Documents", path: "documents", icon: "FileText" },
  ]

  adminNav: NavItem[] = [
    { title: "System Overview", path: "admin/overview", icon: "LayoutGrid" },
    { title: "Manage Users", path: "admin/users", icon: "Users" },
    { title: "Manage Documents", path: "admin/documents", icon: "FileText" },
    { title: "Security & Audit Logs", path: "admin/audit", icon: "ShieldCheck" },
  ]

  constructor(
    private router: Router,
    private elRef: ElementRef,
  ) {
    this.isAdminView.set(this.router.url.includes("/admin"))
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isAdminView.set(event.urlAfterRedirects.includes("/admin"))
      })
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe()
  }

  toggleUserPopover(event: MouseEvent): void {
    event.stopPropagation()
    this.showUserPopover.update((v) => !v)
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showUserPopover.set(false)
    }
  }

  openNewProjectModal(event: MouseEvent): void {
    event.stopPropagation()
    this.showCreateModal.set(false)
    this.modalStateService.showNewProject.set(true)
  }

  openNewDocumentModal(event: MouseEvent): void {
    event.stopPropagation()
    this.showCreateModal.set(false)
    this.modalStateService.showUploadDocument.set(true)
  }

  handleSignOut(): void {
    this.showUserPopover.set(false)
    this.authService.signout().subscribe({
      next: () => this.router.navigate(["/auth/signin"]),
      error: () => this.router.navigate(["/auth/signin"]),
    })
  }

  navigateTo(path: string): void {
    this.showUserPopover.set(false)
    this.router.navigate([path])
  }

  closeMobile(): void {
    this.mobileOpen.set(false)
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0) ?? ""
    const last = lastName?.charAt(0) ?? ""
    return (first + last).toUpperCase() || "US"
  }
}
