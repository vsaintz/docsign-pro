import { Component } from "@angular/core"
import { RouterLink } from "@angular/router"
import { IconComponent } from "@shared/icons/icons.component"

@Component({
  selector: "app-coming-soon",
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="w-full min-h-svh flex flex-col items-center justify-center py-20 px-6">
      <div
        class="max-w-md w-full flex flex-col items-center text-center p-8 rounded-xl border border-border surface-dark shadow-md backdrop-blur-sm"
      >
        <div
          class="w-14 h-14 bg-hover-background rounded-2xl flex items-center justify-center mb-6 text-foreground-muted"
        >
          <app-icon name="Wrench" [size]="24" />
        </div>

        <h1 class="text-2xl font-medium tracking-tight mb-3">I'm still building this</h1>

        <p class="text-foreground-muted text-sm leading-relaxed mb-8">
          This section of DocSign Pro is currently under active development. I am putting things
          together and it will be available soon.
        </p>

        <div class="flex flex-col sm:flex-row w-full gap-3">
          <a
            routerLink="/"
            class="flex-1 flex items-center justify-center py-2.5 px-4 surface-dark bg-(--background) text-(--foreground) text-sm font-medium rounded-lg cursor-pointer transition-opacity hover:opacity-90"
          >
            Go Home
          </a>
          <a
            href="https://github.com/vsaintz/docsign-pro.git"
            target="_blank"
            class="flex-1 flex items-center justify-center py-2.5 px-4 bg-transparent border border-border text-foreground-muted text-sm font-medium rounded-lg cursor-pointer transition-colors hover:text-foreground"
          >
            View GitHub
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ComingSoonComponent {}
