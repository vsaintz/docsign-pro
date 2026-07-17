import { Component, Input, OnChanges, signal } from "@angular/core"
import { DocumentStats } from "@services/document.service"

interface StatItem {
  label: string
  value: string | number
  unit?: string
  subtitle: string
}

@Component({
  selector: "stats-card",
  standalone: true,
  template: `
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 mb-6 border border-border rounded-xl bg-background overflow-hidden"
    >
      @for (item of displayStats(); track item.label) {
        <div
          class="p-6 border-b lg:border-b-0 lg:border-r border-border last:border-r-0 flex flex-col justify-between min-h-35"
        >
          <p class="text-sm text-foreground-muted mb-10">{{ item.label }}</p>
          <div class="flex items-end justify-between gap-4">
            <p class="text-5xl font-bold tracking-tighter text-foreground leading-none">
              {{ item.value }}{{ item.unit ? " " + item.unit : "" }}
            </p>
            <p class="text-xs text-right leading-tight text-foreground-muted">
              {{ item.subtitle }}
            </p>
          </div>
        </div>
      }
    </div>
  `,
})
export class StatsCardComponent implements OnChanges {
  @Input() data: DocumentStats | null = null

  displayStats = signal<StatItem[]>([
    { label: "Total Documents", value: "0", subtitle: "All time uploads" },
    { label: "Signed Documents", value: "0", subtitle: "signatures collected" },
    { label: "Awaiting Signature", value: "0", subtitle: "pending signature" },
  ])

  ngOnChanges() {
    if (!this.data) return

    const total = this.data.total_documents
    const signed = this.data.signed_documents
    const pending = this.data.unsigned_documents

    const signedSubtitle =
      total > 0 ? `${Math.round((signed / total) * 100)}% of total` : "signatures collected"
    const pendingSubtitle =
      total > 0 ? `${Math.round((pending / total) * 100)}% of total` : "pending signature"

    this.displayStats.set([
      { label: "Total Documents", value: total || 0, subtitle: "All time uploads" },
      { label: "Signed Documents", value: signed || 0, subtitle: signedSubtitle },
      { label: "Awaiting Signature", value: pending || 0, subtitle: pendingSubtitle },
    ])
  }
}
