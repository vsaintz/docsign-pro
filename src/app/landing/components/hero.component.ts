import { Component } from "@angular/core"
import { IconComponent } from "@shared/icons/icons.component"

@Component({
  selector: "app-hero",
  imports: [IconComponent],
  standalone: true,
  template: `
    <div class="w-full flex flex-col items-center justify-center py-16 md:py-24 px-6 md:px-10">
      <div class="max-w-5xl flex flex-col items-center text-center mb-12 md:mb-16">
        <h1
          class="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-6 md:mb-8"
        >
          Cryptographic Integrity. <br class="hidden sm:block" />
          <span class="text-accent">Simplified</span> Workflow
        </h1>
        <div class="max-w-2xl mb-8">
          <p class="text-lg md:text-xl text-foreground-muted leading-relaxed">
            Secure your documents with a deterministic signature engine designed for absolute data
            consistency and permanent audit trails.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto">
          <a
            href="/verification"
            class="flex items-center justify-center gap-1.5 py-3 px-4 surface-dark bg-(--background) text-(--foreground) text-sm font-medium rounded-lg cursor-pointer w-full sm:w-auto"
          >
            Verify Signature <app-icon name="ArrowUpRight" [size]="18" />
          </a>
          <a
            href="/comingsoon"
            class="flex items-center justify-center gap-1.5 py-3 px-4 surface-dark bg-(--background-subtle) text-foreground text-sm font-medium rounded-lg cursor-pointer w-full sm:w-auto"
          >
            <app-icon name="Files" [size]="18" /> Learn more
          </a>
        </div>
      </div>
      <div
        class="relative w-full max-w-7xl rounded-3xl border border-border shadow-2xl backdrop-blur-sm"
      >
        <img
          src="https://res.cloudinary.com/defh2c1db/image/upload/v1784123238/1b625e595b8c7db5d8eb8a99392d56b7_bpkzc9.png"
          class="rounded-3xl w-full h-75 sm:h-100 md:h-150 lg:h-190 object-cover"
          alt="Hero Interface Overview"
        />
      </div>
    </div>
  `,
})
export class HeroComponent {}
