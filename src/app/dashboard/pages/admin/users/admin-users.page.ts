import { Component, OnInit, OnDestroy, inject, HostListener } from "@angular/core"
import { CommonModule, DatePipe } from "@angular/common"
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms"
import { Subject, Subscription, debounceTime, distinctUntilChanged } from "rxjs"

import { AuthService, User } from "@services/auth.service"
import { AdminDashboardService } from "@services/admin-dashboard.service"
import { IconComponent } from "@shared/icons/icons.component"

interface StatCard {
  label: string
  value: number
  sub: string
}

@Component({
  selector: "admin-users-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, IconComponent],
  providers: [DatePipe],
  templateUrl: "./admin-users.page.html",
})
export class AdminUsersPage implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder)
  private authService = inject(AuthService)
  private dashboardService = inject(AdminDashboardService)
  protected Math = Math

  users: User[] = []
  totalUsers = 0
  totalActive = 0
  totalStaff = 0
  activeUsers7d = 0
  currentPage = 1
  pageSize = 10
  isLoading = true

  searchQuery = ""
  roleFilter = "all"
  statusFilter = "all"
  private searchSubject = new Subject<string>()
  private searchSubscription!: Subscription

  showAddModal = false
  addUserForm: FormGroup
  errorMessage = ""
  isSubmitting = false
  activeMenuId: string | number | null = null

  showConfirmModal = false
  userToToggle: User | null = null

  showToast = false
  toastMessage = ""
  toastType: "success" | "error" = "success"
  private toastTimeout: any

  constructor() {
    this.addUserForm = this.formBuilder.group({
      first_name: ["", Validators.required],
      middle_name: [""],
      last_name: ["", Validators.required],
      phone_number: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
    })
  }

  ngOnInit() {
    this.loadUsers()
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery = query
        this.currentPage = 1
        this.loadUsers()
      })
  }

  get statCards(): StatCard[] {
    return [
      {
        label: "Total Users",
        value: this.totalUsers,
        sub: "Registered in database",
      },
      {
        label: "Active Accounts",
        value: this.activeUsers7d,
        sub: "Currently active",
      },
      {
        label: "Total Staff",
        value: this.totalStaff,
        sub: "Admin privileges",
      },
    ]
  }

  ngOnDestroy() {
    if (this.searchSubscription) this.searchSubscription.unsubscribe()
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value
    this.searchSubject.next(value)
  }

  onFilterChange() {
    this.currentPage = 1
    this.loadUsers()
  }

  loadUsers(page: number = this.currentPage) {
    this.isLoading = true
    this.dashboardService
      .getAdminUsers(page, this.searchQuery, this.roleFilter, this.statusFilter)
      .subscribe({
        next: (response) => {
          this.users = response.results
          this.totalUsers = response.count
          this.activeUsers7d = response.activeUsers7d
          this.totalStaff = response.total_staff
          this.currentPage = page
          this.isLoading = false
        },
        error: (err) => {
          console.error("Failed to load users", err)
          this.isLoading = false
        },
      })
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.totalUsers) this.loadUsers(this.currentPage + 1)
  }

  prevPage() {
    if (this.currentPage > 1) this.loadUsers(this.currentPage - 1)
  }

  toggleAddModal(show: boolean) {
    this.showAddModal = show
    if (!show) {
      this.addUserForm.reset()
      this.errorMessage = ""
    }
  }

  onSubmitUser() {
    this.errorMessage = ""
    if (this.addUserForm.valid) {
      this.isSubmitting = true
      this.authService.signup(this.addUserForm.value).subscribe({
        next: () => {
          this.isSubmitting = false
          this.toggleAddModal(false)
          this.loadUsers(this.currentPage)
        },
        error: (err) => {
          this.isSubmitting = false
          this.errorMessage = err.error?.detail || err.error?.message || "Registration failed."
        },
      })
    } else {
      this.addUserForm.markAllAsTouched()
      this.errorMessage = "Please fill in all required fields."
    }
  }

  getInitials(user: User): string {
    if (user.first_name && user.last_name)
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    if (user.full_name) {
      const parts = user.full_name.split(" ")
      return parts.length > 1
        ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
        : user.full_name.substring(0, 2).toUpperCase()
    }
    return user.email.substring(0, 2).toUpperCase()
  }

  toggleMenu(userId: string | number, event: Event) {
    event.stopPropagation()
    this.activeMenuId = this.activeMenuId === userId ? null : userId
  }

  @HostListener("document:click")
  closeMenu() {
    this.activeMenuId = null
  }

  initiateToggle(user: User) {
    this.activeMenuId = null
    this.userToToggle = user
    this.showConfirmModal = true
  }

  cancelToggle() {
    this.userToToggle = null
    this.showConfirmModal = false
  }

  confirmToggle() {
    if (!this.userToToggle) return
    const newStatus = !this.userToToggle.is_active
    const actionText = newStatus ? "reactivated" : "deactivated"

    this.dashboardService.toggleUserStatus(this.userToToggle.id, newStatus).subscribe({
      next: () => {
        this.showConfirmModal = false
        this.userToToggle = null
        this.loadUsers(this.currentPage)
        this.displayToast(`User account successfully ${actionText}.`, "success")
      },
      error: (err) => {
        this.showConfirmModal = false
        this.userToToggle = null
        this.displayToast(err.error?.error || `Failed to ${actionText} user.`, "error")
      },
    })
  }

  displayToast(message: string, type: "success" | "error") {
    this.toastMessage = message
    this.toastType = type
    this.showToast = true

    if (this.toastTimeout) clearTimeout(this.toastTimeout)
    this.toastTimeout = setTimeout(() => {
      this.showToast = false
    }, 3000)
  }
}
