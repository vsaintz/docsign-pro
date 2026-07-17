import { Component, HostListener, ElementRef } from "@angular/core"
import { IconComponent } from "@shared/icons/icons.component"
import { AppIconName } from "@shared/icons/icons"

interface NavChild {
  label: string
  description: string
  link: string
  icon?: AppIconName
}

interface NavItem {
  title: string
  icon: AppIconName
  children?: NavChild[]
}

@Component({
  selector: "app-navigation",
  standalone: true,
  imports: [IconComponent],
  template: `
    <nav
      class="flex w-full items-center justify-between py-3 px-6 md:px-8 bg-background sticky top-0 z-100"
    >
      <div class="flex items-center z-50">
        <span class="text-xl font-bold tracking-tight cursor-pointer">DocSign Pro</span>
      </div>

      <button
        class="md:hidden flex flex-col items-center justify-center gap-1.5 w-9 h-9 rounded-lg text-foreground cursor-pointer z-50 focus:outline-none"
        (click)="toggleMobileMenu()"
        aria-label="Toggle Menu"
      >
        <span
          class="w-4.5 h-0.5 bg-current rounded-full transition-transform duration-300"
          [class.rotate-45]="isMobileMenuOpen"
          [class.translate-y-[3.75px]]="isMobileMenuOpen"
        ></span>
        <span
          class="w-4.5 h-0.5 bg-current rounded-full transition-transform duration-300"
          [class.-rotate-45]="isMobileMenuOpen"
          [class.-translate-y-[3.75px]]="isMobileMenuOpen"
        ></span>
      </button>

      <div
        class="absolute md:static top-full left-0 w-full md:w-auto bg-background md:bg-transparent flex-col md:flex-row items-start md:items-center p-6 md:p-0 gap-4 md:gap-1 border-b md:border-none border-border shadow-xl md:shadow-none md:flex transition-all duration-200"
        [class.hidden]="!isMobileMenuOpen"
        [class.flex]="isMobileMenuOpen"
      >
        @for (item of NAV_ITEMS; track item.title) {
          <div class="relative w-full md:w-auto">
            <button
              type="button"
              (click)="toggleDropdown(item.title, $event)"
              [class.bg-hover-background]="activeDropdown === item.title"
              [class.text-foreground]="activeDropdown === item.title"
              class="flex w-full md:w-auto items-center justify-between md:justify-start gap-1.5 px-4 py-3 md:py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-hover-background rounded-lg transition-all duration-200 cursor-pointer group"
            >
              {{ item.title }}
              <app-icon
                [name]="item.icon"
                [size]="14"
                class="opacity-40 transition-transform duration-300 group-hover:opacity-100"
                [class.rotate-180]="activeDropdown === item.title"
              />
            </button>

            @if (item.children && activeDropdown === item.title) {
              <div
                class="static md:absolute top-full left-0 mt-2 md:mt-3 w-full md:w-80 bg-background-subtle md:border border-border rounded-2xl md:shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 md:slide-in-from-top-2 duration-200"
              >
                <div class="grid gap-1">
                  @for (child of item.children; track child.label) {
                    <a
                      [href]="child.link"
                      class="group flex items-start gap-4 p-3 rounded-xl hover:bg-hover-background transition-all border border-transparent hover:border-border/50"
                    >
                      <div
                        class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-hover-background group-hover:bg-accent/10 transition-colors"
                      >
                        <app-icon
                          [name]="'ChevronDown'"
                          [size]="14"
                          class="text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>

                      <div class="flex flex-col">
                        <span
                          class="text-sm font-medium text-foreground group-hover:text-accent transition-colors"
                        >
                          {{ child.label }}
                        </span>
                        <span class="text-xs text-foreground-muted mt-0.5 leading-relaxed">
                          {{ child.description }}
                        </span>
                      </div>
                    </a>
                  }
                </div>

                <div
                  class="mt-2 border-t border-border p-3 bg-hover-background/30 rounded-b-xl hidden md:block"
                >
                  <a href="/" class="text-xs font-medium text-accent hover:underline"
                    >View All Updates</a
                  >
                </div>
              </div>
            }
          </div>
        }

        <div class="flex md:hidden flex-col w-full gap-3 mt-4 pt-4">
          <a
            href="/comingsoon"
            class="w-full text-center px-4 py-2 border border-border rounded-lg text-foreground-muted hover:text-foreground font-medium transition-colors"
          >
            Contact
          </a>
          <a
            href="/auth/signin"
            class="w-full text-center surface-dark bg-(--background) text-(--foreground) px-6 py-2.5 rounded-lg font-medium"
          >
            Sign In
          </a>
        </div>
      </div>

      <div class="hidden md:flex items-center gap-4 text-sm">
        <a
          href="/comingsoon"
          class="px-4 py-2 text-foreground-muted hover:text-foreground font-medium transition-colors cursor-pointer"
        >
          Contact
        </a>
        <a
          href="/auth/signin"
          class="surface-dark bg-(--background) text-(--foreground) px-6 py-2.5 rounded-lg font-medium cursor-pointer"
        >
          Sign In
        </a>
      </div>
    </nav>
  `,
})
export class NavigationComponent {
  activeDropdown: string | null = null
  isMobileMenuOpen: boolean = false

  readonly NAV_ITEMS: NavItem[] = [
    {
      title: "Documentation",
      icon: "ChevronDown",
      children: [
        {
          label: "Quick Start",
          description: "Get started with Digital Signature in under 5 minutes.",
          link: "/comingsoon",
        },
        {
          label: "Architecture",
          description: "Technical overview of the cryptographic system.",
          link: "/comingsoon",
        },
        {
          label: "API Reference",
          description: "Complete REST API documentation and examples.",
          link: "/comingsoon",
        },
        {
          label: "Security Model",
          description: "How signatures, verification, and auditing work.",
          link: "/comingsoon",
        },
      ],
    },
    {
      title: "Features",
      icon: "ChevronDown",
      children: [
        {
          label: "Digital Signatures",
          description: "RSA-PSS cryptographic signing for documents.",
          link: "/comingsoon",
        },
        {
          label: "Verification",
          description: "Instant tamper detection and integrity checks.",
          link: "/comingsoon",
        },
        {
          label: "File Support",
          description: "CSV and Excel with flexible schema handling.",
          link: "/comingsoon",
        },
      ],
    },
    {
      title: "Resources",
      icon: "ChevronDown",
      children: [
        {
          label: "GitHub",
          description: "View source, report issues, and contribute.",
          link: "https://github.com/vsaintz/docsign-pro.git",
        },
        {
          label: "Changelog",
          description: "Version history and release notes.",
          link: "/comingsoon",
        },
        {
          label: "License",
          description: "MIT License - use freely in any project.",
          link: "https://github.com/vsaintz/docsign-pro/blob/main/LICENSE",
        },
      ],
    },
  ]

  constructor(private el: ElementRef) {}

  toggleDropdown(title: string, event: Event) {
    event.stopPropagation()
    this.activeDropdown = this.activeDropdown === title ? null : title
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen
    if (!this.isMobileMenuOpen) this.activeDropdown = null
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.activeDropdown = null
      this.isMobileMenuOpen = false
    }
  }
}
