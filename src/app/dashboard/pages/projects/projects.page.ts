import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  Inject,
  effect,
  untracked,
} from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { forkJoin } from "rxjs"
import { ProjectService, ProjectDTO } from "@services/project.service"
import { ModalStateService } from "@services/modal-state.service"
import { DocumentService, Document as DocumentModel } from "@services/document.service"
import { IconComponent } from "@shared/icons/icons.component"
import { COLOR_MAP } from "@shared/components/projects-themes.component"
import { SvgFolderIconComponent } from "./components/icons/svg-folder-icon.component"
import { SvgEmptyStateComponent } from "./components/icons/svg-emptystate-icon.component"

export type ViewMode = "grid" | "list"
export type SortKey = "name" | "modified" | "documents"

export interface Project {
  id: string
  name: string
  docCount: number
  modifiedAt: Date
  modifiedLabel: string
  accentClass: string
  pinned?: boolean
  owner: string
}

@Component({
  selector: "page-projects",
  standalone: true,
  imports: [IconComponent, SvgFolderIconComponent, SvgEmptyStateComponent],
  templateUrl: "./projects.page.html",
})
export class ProjectsPage implements OnInit, OnDestroy {
  modalStateService = inject(ModalStateService)
  viewMode = signal<ViewMode>("grid")
  sortKey = signal<SortKey>("modified")
  searchQuery = signal("")

  activeMenu = signal<string | null>(null)
  lastOpenedMap = signal<Map<string, number>>(new Map())
  isLoading = signal(true)
  error = signal<string | null>(null)

  openFolderId = signal<string | null>(null)

  showRenameModal = signal(false)
  renamingProject = signal<Project | null>(null)
  renameValue = signal("")
  renameError = signal<string | null>(null)

  allDocuments = signal<DocumentModel[]>([])
  docsLoading = signal(false)
  showAddDocModal = signal(false)
  addDocError = signal<string | null>(null)

  removingDocIds = signal<Set<string>>(new Set())

  readonly sortOptions: { key: SortKey; label: string }[] = [
    { key: "modified", label: "Last modified" },
    { key: "name", label: "Name" },
    { key: "documents", label: "Documents" },
  ]

  projects = signal<Project[]>([])

  openProject = computed(() => {
    const id = this.openFolderId()
    if (!id) return null
    return this.projects().find((p) => p.id === id) ?? null
  })

  folderDocuments = computed(() => {
    const id = this.openFolderId()
    if (!id) return []
    return this.allDocuments().filter((d) => d.project === id)
  })

  unassignedDocuments = computed(() => {
    return this.allDocuments().filter((d) => !d.project)
  })

  recentProjects = computed(() => {
    const openedMap = this.lastOpenedMap()
    return [...this.projects()]
      .filter((p) => openedMap.has(p.id))
      .sort((a, b) => (openedMap.get(b.id) ?? 0) - (openedMap.get(a.id) ?? 0))
      .slice(0, 5)
  })

  filteredProjects = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    let list = q
      ? this.projects().filter((p) => p.name.toLowerCase().includes(q))
      : [...this.projects()]

    switch (this.sortKey()) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "documents":
        list.sort((a, b) => b.docCount - a.docCount)
        break
      case "modified":
        list.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
        break
    }
    return list
  })

  private readonly isBrowser: boolean
  private readonly onDocClick = () => this.activeMenu.set(null)
  private readonly onPopState = (event: PopStateEvent) => {
    const folderId = event.state?.folderId ?? null
    this.openFolderId.set(folderId)
  }

  constructor(
    private projectService: ProjectService,
    private documentService: DocumentService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId)
    effect(() => {
      const newDoc = this.modalStateService.newProjectCreated()
      if (newDoc) {
        untracked(() => {
          const project = ProjectsPage.toProject(newDoc)
          if (!this.projects().some((p) => p.id === project.id)) {
            this.projects.update((list) => [project, ...list])
          }
          this.modalStateService.newProjectCreated.set(null)
        })
      }
    })
  }

  ngOnInit() {
    if (this.isBrowser) {
      document.addEventListener("click", this.onDocClick)
      window.addEventListener("popstate", this.onPopState)
      history.replaceState({ folderId: null }, "")
    }
    this.loadData()
  }

  loadData() {
    this.isLoading.set(true)
    forkJoin({
      projects: this.projectService.list(),
      documents: this.documentService.getDocuments(),
    }).subscribe({
      next: ({ projects, documents }) => {
        this.projects.set(projects.map(ProjectsPage.toProject))
        this.allDocuments.set(documents)
        this.isLoading.set(false)
      },
      error: () => {
        this.error.set("Failed to load data. Please refresh.")
        this.isLoading.set(false)
      },
    })
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      document.removeEventListener("click", this.onDocClick)
      window.removeEventListener("popstate", this.onPopState)
    }
  }

  toggleMenu(id: string, event: MouseEvent) {
    event.stopPropagation()
    this.activeMenu.update((cur) => (cur === id ? null : id))
  }

  openFolder(project: Project) {
    this.openFolderId.set(project.id)
    this.activeMenu.set(null)
    this.lastOpenedMap.update((map) => new Map(map).set(project.id, Date.now()))
    if (this.isBrowser) {
      history.pushState({ folderId: project.id }, "")
    }
  }

  closeFolder() {
    this.openFolderId.set(null)
    if (this.isBrowser) {
      history.pushState({ folderId: null }, "")
    }
  }

  deleteFolder(id: string) {
    this.projectService.delete(id).subscribe({
      next: () => {
        this.projects.update((list) => list.filter((p) => p.id !== id))
        this.allDocuments.update((docs) =>
          docs.map((d) => (d.project === id ? { ...d, project: null } : d)),
        )
        this.activeMenu.set(null)
        if (this.openFolderId() === id) this.openFolderId.set(null)
      },
      error: () => {
        this.error.set("Failed to delete folder. Please try again.")
      },
    })
  }

  togglePin(id: string) {
    const project = this.projects().find((p) => p.id === id)
    if (!project) return
    this.projectService.update(id, { pinned: !project.pinned }).subscribe({
      next: (dto) => {
        this.projects.update((list) =>
          list.map((p) => (p.id === id ? ProjectsPage.toProject(dto) : p)),
        )
        this.activeMenu.set(null)
      },
      error: () => {
        this.error.set("Failed to update folder. Please try again.")
      },
    })
  }

  openRenameModal(project: Project, event: MouseEvent) {
    event.stopPropagation()
    this.renamingProject.set(project)
    this.renameValue.set(project.name)
    this.renameError.set(null)
    this.showRenameModal.set(true)
    this.activeMenu.set(null)
  }

  submitRename() {
    const project = this.renamingProject()
    const newName = this.renameValue().trim()
    if (!project || !newName) return
    if (newName.toLowerCase() === project.name.toLowerCase()) {
      this.showRenameModal.set(false)
      return
    }
    const duplicate = this.projects().some(
      (p) => p.id !== project.id && p.name.toLowerCase() === newName.toLowerCase(),
    )
    if (duplicate) {
      this.renameError.set(`A folder named "${newName}" already exists.`)
      return
    }
    this.projectService.update(project.id, { name: newName }).subscribe({
      next: (dto) => {
        this.projects.update((list) =>
          list.map((p) => (p.id === project.id ? ProjectsPage.toProject(dto) : p)),
        )
        this.showRenameModal.set(false)
        this.renamingProject.set(null)
        this.renameError.set(null)
      },
      error: (err) => {
        const detail = err?.error?.name?.[0] ?? err?.error?.detail ?? null
        this.renameError.set(detail ?? "Failed to rename folder. Please try again.")
      },
    })
  }

  closeRenameModal() {
    this.showRenameModal.set(false)
    this.renamingProject.set(null)
    this.renameError.set(null)
  }

  openAddDocModal(event?: MouseEvent) {
    event?.stopPropagation()
    this.addDocError.set(null)
    this.showAddDocModal.set(true)
  }

  addDocumentToFolder(doc: DocumentModel) {
    const folderId = this.openFolderId()
    if (!folderId) return
    this.projectService.addDocument(folderId, doc.id).subscribe({
      next: () => {
        this.allDocuments.update((docs) =>
          docs.map((d) => (d.id === doc.id ? { ...d, project: folderId } : d)),
        )
        this.projects.update((list) =>
          list.map((p) => (p.id === folderId ? { ...p, docCount: p.docCount + 1 } : p)),
        )
        this.showAddDocModal.set(false)
        this.addDocError.set(null)
      },
      error: () => {
        this.addDocError.set("Failed to add document. Please try again.")
      },
    })
  }

  removeDocumentFromFolder(doc: DocumentModel) {
    const folderId = this.openFolderId()
    if (!folderId) return
    this.removingDocIds.update((ids) => new Set(ids).add(doc.id))
    this.projectService.removeDocument(doc.id).subscribe({
      next: () => {
        this.allDocuments.update((docs) =>
          docs.map((d) => (d.id === doc.id ? { ...d, project: null } : d)),
        )
        this.projects.update((list) =>
          list.map((p) =>
            p.id === folderId ? { ...p, docCount: Math.max(0, p.docCount - 1) } : p,
          ),
        )
        this.removingDocIds.update((ids) => {
          const next = new Set(ids)
          next.delete(doc.id)
          return next
        })
      },
      error: () => {
        this.error.set("Failed to remove document. Please try again.")
        this.removingDocIds.update((ids) => {
          const next = new Set(ids)
          next.delete(doc.id)
          return next
        })
      },
    })
  }

  getFolderColor(accentClass: string): string {
    return COLOR_MAP.get(accentClass)?.stroke || "oklch(0.55 0.07 240)"
  }

  getFolderBgColor(accentClass: string): string {
    return COLOR_MAP.get(accentClass)?.fill || "oklch(0.91 0.05 240 / 0.45)"
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  dismissError() {
    this.error.set(null)
  }

  static toProject(dto: ProjectDTO): Project {
    return {
      id: dto.id,
      name: dto.name,
      docCount: dto.doc_count,
      modifiedAt: new Date(dto.updated_at),
      modifiedLabel: ProjectsPage.formatRelative(new Date(dto.updated_at)),
      accentClass: dto.color,
      pinned: dto.pinned,
      owner: "You",
    }
  }

  static formatRelative(date: Date): string {
    const diff = Date.now() - date.getTime()
    const hours = diff / 36e5
    if (hours < 1) return "Just now"
    if (hours < 24) return `${Math.floor(hours)} hours ago`
    if (hours < 48) return "Yesterday"
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  }

  getDocType(doc: DocumentModel): string {
    if (doc.file_type) {
      return doc.file_type.split(".").pop() ?? "Unknown"
    }
    return "Unknown"
  }
}
