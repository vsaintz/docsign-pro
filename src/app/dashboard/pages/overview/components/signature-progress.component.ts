import { Component, Input, OnChanges } from "@angular/core"

@Component({
  selector: "widget-signature-progress",
  standalone: true,
  template: `
    <div class="rounded-[10px] border border-border bg-background overflow-hidden">
      <div class="px-5 py-3.5 border-b border-border">
        <h3 class="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground">
          Signature Progress
        </h3>
      </div>
      <div class="flex flex-col items-center px-5 py-6">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-muted mb-4">
          This month
        </p>
        <svg class="w-30 h-30 overflow-visible" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="oklch(0.93 0.004 95)"
            stroke-width="9"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#d67e5f"
            stroke-width="9"
            stroke-linecap="round"
            stroke-dasharray="314.16"
            [attr.stroke-dashoffset]="ringOffset"
            transform="rotate(-90 60 60)"
          />
          <text
            x="60"
            y="56"
            text-anchor="middle"
            font-family="var(--font-playfair)"
            font-size="22"
            font-weight="400"
            fill="oklch(0.22 0 0)"
          >
            {{ signedPct }}%
          </text>
          <text
            x="60"
            y="72"
            text-anchor="middle"
            font-family="var(--font-dm-sans)"
            font-size="10"
            font-weight="300"
            fill="oklch(0.58 0 0)"
          >
            complete
          </text>
        </svg>
        <div class="mt-4 text-center">
          <strong class="block text-[22px] font-normal text-foreground leading-none mb-1">
            {{ signed }} / {{ total }}
          </strong>
          <span class="text-[12px] font-light text-foreground-muted">documents signed</span>
        </div>
      </div>
    </div>
  `,
})
export class SignatureProgressComponent implements OnChanges {
  @Input({ required: true }) total = 0
  @Input({ required: true }) signed = 0

  signedPct = 0
  ringOffset = 0

  ngOnChanges(): void {
    if (this.total > 0) {
      this.signedPct = Math.round((this.signed / this.total) * 100)
      const circ = 2 * Math.PI * 50
      this.ringOffset = circ - (this.signedPct / 100) * circ
    }
  }
}
