import { Component, inject } from "@angular/core"
import { ToastService } from "@services/toast.service"
import { IconComponent } from "@shared/icons/icons.component"

@Component({
  selector: "app-toast",
  standalone: true,
  imports: [IconComponent],
  template: `
    <div
      class="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-100 flex flex-col gap-2 sm:w-full sm:max-w-md pointer-events-none"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg bg-background transition-all duration-200 {{
            colorsFor(toast.type)
          }}"
        >
          <div class="shrink-0 mt-0.5">
            <app-icon [name]="iconFor(toast.type)" [size]="16" />
          </div>
          <span class="flex-1 text-[13px] font-medium leading-snug text-foreground">
            {{ toast.message }}
          </span>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toastService = inject(ToastService)
  iconFor(type: string): "CircleCheck" | "CircleAlert" | "Info" {
    switch (type) {
      case "success":
        return "CircleCheck"
      case "error":
        return "CircleAlert"
      case "warning":
        return "CircleAlert"
      default:
        return "Info"
    }
  }
  colorsFor(type: string): string {
    switch (type) {
      case "success":
        return "border-[oklch(0.85_0.08_150)] [&_app-icon]:text-[oklch(0.45_0.14_150)]"
      case "error":
        return "border-error-border [&_app-icon]:text-error"
      case "warning":
        return "border-[oklch(0.85_0.10_80)] [&_app-icon]:text-[oklch(0.45_0.14_80)]"
      default:
        return "border-border [&_app-icon]:text-foreground-muted"
    }
  }
}
