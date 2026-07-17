import { Component } from "@angular/core"

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [],
  template: `
    <footer
      class="w-full surface-dark bg-(--background) text-(--foreground) border-t border-(--border) py-12 px-6 md:px-8"
    >
      <div class="w-full max-w-7xl mx-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 md:mb-24">
          <div class="col-span-1 sm:col-span-2 lg:col-span-1">
            <h2 class="text-xl font-semibold mb-4 surface-dark text-(--foreground)">
              DocSign Pro.
            </h2>
            <p class="text-sm leading-relaxed surface-dark text-(--foreground-muted) max-w-sm">
              Open-source cryptographic document signing with RSA-PSS signatures, audit trails, and
              tamper detection. Built for integrity and transparency.
            </p>
          </div>

          @for (group of footerGroups; track group.section) {
            <div class="flex flex-col gap-4">
              <h3 class="text-xs font-semibold uppercase tracking-widest">{{ group.section }}</h3>
              @for (link of group.links; track link.title) {
                <a
                  href="{{ link.link }}"
                  class="w-fit text-sm surface-dark text-(--foreground-muted) hover:text-accent transition-colors"
                >
                  {{ link.title }}
                </a>
              }
            </div>
          }

          <div class="flex flex-col gap-4">
            <h3 class="text-xs font-semibold uppercase tracking-widest">Status</h3>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-(--status) animate-pulse"></span>
              <span class="text-sm">All Systems Operational</span>
            </div>
          </div>
        </div>

        <div
          class="pt-8 surface-dark border-t border-(--border) flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <p class="text-xs text-center md:text-left">
            &copy; 2026 DocSign Pro. Open source under
            <a href="https://github.com/vsaintz/docsign-pro/blob/main/LICENSE">
              <span
                class="underline underline-offset-2 cursor-pointer hover:text-accent transition-colors"
                >MIT License.</span
              >
            </a>
          </p>
          <div class="flex flex-wrap justify-center gap-6">
            <a
              href="https://github.com/vsaintz/docsign-pro.git"
              class="text-xs hover:text-accent transition-colors"
              >GitHub</a
            >
            <a
              href="https://github.com/vsaintz/docsign-pro.git"
              class="text-xs hover:text-accent transition-colors"
              >Discussions</a
            >
            <a
              href="https://github.com/vsaintz/docsign-pro.git"
              class="text-xs hover:text-accent transition-colors"
              >Security</a
            >
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  footerGroups = [
    {
      section: "Product",
      links: [
        { title: "Features", link: "/comingsoon" },
        { title: "Security", link: "/comingsoon" },
        { title: "Verification", link: "/comingsoon" },
      ],
    },
    {
      section: "Developers",
      links: [
        { title: "Documentation", link: "/comingsoon" },
        { title: "API Reference", link: "/comingsoon" },
        { title: "GitHub", link: "https://github.com/vsaintz/docsign-pro.git" },
        { title: "Changelog", link: "/comingsoon" },
      ],
    },
  ]
}
