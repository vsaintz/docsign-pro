import { Component, OnInit, inject } from "@angular/core"
import { RouterLink } from "@angular/router"
import { AsyncPipe } from "@angular/common"
import { Observable, map, shareReplay } from "rxjs"

import { AuthService } from "@services/auth.service"
import { DocumentService, Document, DocumentStats } from "@services/document.service"
import { IconComponent } from "@shared/icons/icons.component"
import { SignatureProgressComponent } from "./components/signature-progress.component"

export type ActivityIconType = "Barcode" | "Clock"
export type QuickActionType = "Upload" | "Clock"

export interface StatCard {
  label: string
  value: number | string
  sub: string
  warnSub?: boolean
  accentColor: string
}

export interface ActivityItem {
  iconType: ActivityIconType
  title: string
  meta: string
  time: string
  badge?: { label: string; bg: string; text: string }
}

export interface RecentDoc {
  name: string
  date: string
  file_type?: string
}

export interface QuickAction {
  type: QuickActionType
  label: string
}

@Component({
  selector: "page-overview",
  standalone: true,
  imports: [RouterLink, AsyncPipe, IconComponent, SignatureProgressComponent],
  templateUrl: "./overview.page.html",
})
export class OverviewPage implements OnInit {
  private authService = inject(AuthService)
  private documentService = inject(DocumentService)

  user$ = this.authService.user$
  today = ""
  greeting = ""

  stats$!: Observable<DocumentStats>
  statCards$!: Observable<StatCard[]>
  recentDocs$!: Observable<RecentDoc[]>
  activityItems$!: Observable<ActivityItem[]>

  readonly quickActions: QuickAction[] = [
    {
      type: "Upload",
      label: "Upload a document",
    },
    {
      type: "Clock",
      label: "View pending signatures",
    },
  ]

  ngOnInit(): void {
    const now = new Date()
    const hour = now.getHours()

    this.today = now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    this.greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

    this.stats$ = this.documentService.getDocumentStats().pipe(shareReplay(1))

    this.statCards$ = this.stats$.pipe(
      map((stats) => {
        const storage = this.formatStorage(stats.total_storage_bytes)
        const completionRate =
          stats.total_documents > 0
            ? Math.round((stats.signed_documents / stats.total_documents) * 100)
            : 0
        return [
          {
            label: "Total Documents",
            value: stats.total_documents,
            sub: "All time uploads",
            accentColor: "bg-[oklch(0.42_0.08_240)]",
          },
          {
            label: "Signed Documents",
            value: stats.signed_documents,
            sub: `${completionRate}% completion rate`,
            accentColor: "bg-[oklch(0.55_0.14_149)]",
          },
          {
            label: "Awaiting Signature",
            value: stats.unsigned_documents,
            sub: "pending signatures",
            warnSub: true,
            accentColor: "bg-[oklch(0.68_0.13_68)]",
          },
          {
            label: "Total Storage Used",
            value: `${storage.value} ${storage.unit}`,
            sub: "space consumed",
            accentColor: "bg-[oklch(0.70_0.04_240)]",
          },
        ]
      }),
    )

    const docs$ = this.documentService.getDocuments().pipe(shareReplay(1))

    this.recentDocs$ = docs$.pipe(
      map((docs) =>
        docs.slice(0, 5).map((doc) => ({
          name: doc.name,
          date: new Date(doc.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          file_type: doc.file_type,
        })),
      ),
    )

    this.activityItems$ = docs$.pipe(
      map((docs) => docs.slice(0, 5).map((doc) => this.mapDocToActivity(doc))),
    )
  }

  private mapDocToActivity(doc: Document): ActivityItem {
    const isSigned = doc.signing_status === "signed"
    return {
      iconType: isSigned ? "Barcode" : "Clock",
      title: doc.name,
      meta: isSigned ? `Signed document` : `Awaiting your signature`,
      time: new Date(doc.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      badge: isSigned
        ? {
            label: "Signed",
            bg: "bg-[oklch(0.94_0.04_250)]",
            text: "text-[oklch(0.4_0.15_250)]",
          }
        : {
            label: "Pending",
            bg: "bg-[oklch(0.94_0.07_68)]",
            text: "text-[oklch(0.42_0.12_68)]",
          },
    }
  }

  private formatStorage(bytes: number) {
    if (!bytes || bytes === 0) return { value: 0, unit: "KB" }
    const k = 1024
    const kb = bytes / k
    const sizes = ["KB", "MB", "GB", "TB"]
    const i = Math.max(0, Math.min(Math.floor(Math.log(kb) / Math.log(k)), sizes.length - 1))
    return {
      value: parseFloat((kb / Math.pow(k, i)).toFixed(1)),
      unit: sizes[i],
    }
  }

  getDocType(fileType?: string): string {
    if (fileType) {
      return fileType.split(".").pop() ?? "Unknown"
    }
    return "Unknown"
  }
}
