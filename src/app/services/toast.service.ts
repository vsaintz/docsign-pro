import { Injectable, signal } from "@angular/core"

export type ToastType = "success" | "error" | "info" | "warning"

export interface Toast {
  id: number
  message: string
  type: ToastType
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private nextId = 0
  toasts = signal<Toast[]>([])

  private show(message: string, type: ToastType, duration: number) {
    const id = this.nextId++
    this.toasts.update((list) => [...list, { id, message, type }])
    setTimeout(() => this.dismiss(id), duration)
  }

  success(message: string, duration = 4000) {
    this.show(message, "success", duration)
  }

  error(message: string, duration = 5000) {
    this.show(message, "error", duration)
  }

  info(message: string, duration = 4000) {
    this.show(message, "info", duration)
  }

  warning(message: string, duration = 4500) {
    this.show(message, "warning", duration)
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id))
  }
}
