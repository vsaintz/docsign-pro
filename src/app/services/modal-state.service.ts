import { Injectable, signal } from "@angular/core"
import { ProjectDTO } from "@services/project.service"

@Injectable({ providedIn: "root" })
export class ModalStateService {
  showNewProject = signal(false)
  showUploadDocument = signal(false)

  newProjectCreated = signal<ProjectDTO | null>(null)
}
