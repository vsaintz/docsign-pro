import { Component, Input } from "@angular/core"

export interface ActivityPoint {
  label: string
  uploaded: number
  verified: number
}

interface Point {
  x: number
  y: number
}

@Component({
  selector: "admin-activity-chart",
  standalone: true,
  templateUrl: "./activity-chart.component.html",
})
export class ActivityChartComponent {
  @Input() data: ActivityPoint[] = []

  readonly viewW = 480
  readonly viewH = 168
  readonly padL = 26
  readonly padR = 4
  readonly padT = 10
  readonly padB = 20

  get chartW(): number {
    return this.viewW - this.padL - this.padR
  }

  get chartH(): number {
    return this.viewH - this.padT - this.padB
  }

  get maxValue(): number {
    const values = this.data.flatMap((d) => [d.uploaded, d.verified])
    const max = Math.max(1, ...values)
    return Math.ceil(max / 5) * 5
  }

  get gridSteps(): { y: number; value: number }[] {
    return [0, 1, 2, 3].map((i) => ({
      y: this.padT + (i / 3) * this.chartH,
      value: Math.round(this.maxValue * (1 - i / 3)),
    }))
  }

  xAt(index: number): number {
    if (this.data.length <= 1) return this.padL
    return this.padL + (index / (this.data.length - 1)) * this.chartW
  }

  yAt(value: number): number {
    return this.padT + this.chartH - (value / this.maxValue) * this.chartH
  }

  private getPoints(key: "uploaded" | "verified"): Point[] {
    return this.data.map((d, i) => ({ x: this.xAt(i), y: this.yAt(d[key]) }))
  }

  private smoothPath(points: Point[]): string {
    if (points.length === 0) return ""
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`
    if (points.length === 2) {
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`
    }

    let d = `M ${points[0].x},${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(i + 2, points.length - 1)]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
    }
    return d
  }

  linePath(key: "uploaded" | "verified"): string {
    return this.smoothPath(this.getPoints(key))
  }

  areaPath(key: "uploaded" | "verified"): string {
    const points = this.getPoints(key)
    if (!points.length) return ""
    const base = this.padT + this.chartH
    const first = points[0]
    const last = points[points.length - 1]
    return `${this.smoothPath(points)} L ${last.x},${base} L ${first.x},${base} Z`
  }
}
