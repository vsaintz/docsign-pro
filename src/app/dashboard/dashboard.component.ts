import { Component, ViewChild, inject, signal } from "@angular/core"
import { RouterOutlet, Router } from "@angular/router"

import { SvgSitelogoComponent } from "@shared/icons/svg-sitelogo.component"
import { IconComponent } from "@shared/icons/icons.component"
import { SidebarComponent } from "@dashboard/components/sidebar.component"

import { ModalStateService } from "@services/modal-state.service"
import { ProjectService } from "@services/project.service"
import { FileUploadComponent } from "@dashboard/components/file-upload.component"
import { THEMES } from "@shared/components/projects-themes.component"

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    RouterOutlet,
    SvgSitelogoComponent,
    SidebarComponent,
    IconComponent,
    FileUploadComponent,
  ],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent

  private router = inject(Router)
  modalService = inject(ModalStateService)
  private projectService = inject(ProjectService)

  newFolderName = signal("")
  newFolderColor = signal(THEMES[0].bg)
  error = signal<string | null>(null)
  readonly colorOptions = THEMES

  closeProjectModal(): void {
    this.modalService.showNewProject.set(false)
    this.newFolderName.set("")
    this.error.set(null)
  }

  closeUploadModal(): void {
    this.modalService.showUploadDocument.set(false)
  }

  createFolder(): void {
    const name = this.newFolderName().trim()
    if (!name) return

    this.projectService.list().subscribe({
      next: (existingProjects) => {
        const duplicate = existingProjects.some((p) => p.name.toLowerCase() === name.toLowerCase())

        if (duplicate) {
          this.error.set(`A folder named "${name}" already exists.`)
          return
        }
        this.projectService.create({ name, color: this.newFolderColor() }).subscribe({
          next: (dto) => {
            this.modalService.newProjectCreated.set(dto)
            this.closeProjectModal()
            this.router.navigate(["/dashboard/projects"])
          },
          error: () => {
            this.error.set("Failed to create folder. Please try again.")
          },
        })
      },
      error: () => {
        this.error.set("Could not verify folder name. Please try again.")
      },
    })
  }

  onUploadSuccess(): void {
    this.closeUploadModal()
    this.router.navigate(["/dashboard/documents"])
  }
}
