import { Component, Input } from "@angular/core"

export interface StatusSegment {
  label: string
  value: number
  color: string
}

@Component({
  selector: "admin-status-donut",
  standalone: true,
  templateUrl: "./status-donut.component.html",
})
export class StatusDonutComponent {
  @Input() segments: StatusSegment[] = []

  readonly size = 132
  readonly strokeWidth = 18

  get radius(): number {
    return (this.size - this.strokeWidth) / 2
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius
  }

  get center(): number {
    return this.size / 2
  }

  get total(): number {
    return this.segments.reduce((sum, s) => sum + s.value, 0) || 1
  }

  dashArray(value: number): string {
    const length = (value / this.total) * this.circumference
    return `${length} ${this.circumference - length}`
  }

  dashOffset(index: number): number {
    const before = this.segments.slice(0, index).reduce((sum, s) => sum + s.value, 0)
    return -(before / this.total) * this.circumference
  }

  percent(value: number): number {
    return Math.round((value / this.total) * 100)
  }
}
