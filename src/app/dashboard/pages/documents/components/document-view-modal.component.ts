import { Component, Input, Output, EventEmitter } from "@angular/core"
import { IconComponent } from "@shared/icons/icons.component"

@Component({
  selector: "document-view-modal",
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 sm:p-6"
        (click)="close.emit()"
      >
        <div
          class="bg-background border border-border rounded-xl w-full max-w-5xl flex flex-col shadow-xl overflow-hidden max-h-[85vh] transition-all transform"
          (click)="$event.stopPropagation()"
        >
          <div
            class="flex items-center justify-between px-6 py-5 border-b border-border bg-background-subtle"
          >
            <div class="flex flex-col min-w-0">
              <h2 class="text-lg text-foreground truncate">{{ documentName }}</h2>
              <p class="text-[13px] text-foreground-muted">Data Preview</p>
            </div>
            <button
              (click)="close.emit()"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-foreground-muted hover:bg-border hover:text-foreground transition-colors shrink-0 cursor-pointer"
            >
              <app-icon name="X" [size]="16" />
            </button>
          </div>

          <div class="flex-1 overflow-auto bg-background p-6">
            @if (isLoading) {
              <div class="flex flex-col items-center justify-center py-20 gap-4">
                <div
                  class="w-10 h-10 rounded-full border-3 border-border border-t-accent animate-spin"
                ></div>
                <p class="text-sm font-medium text-foreground-muted">Loading data</p>
              </div>
            } @else if (data && data.normalized_data) {
              <div class="rounded-xl border border-border overflow-hidden">
                <div class="overflow-x-auto max-h-[50vh] scrollbar-thin">
                  <table class="w-full text-left border-collapse">
                    <thead
                      class="bg-background-subtle sticky top-0 z-10 shadow-[0_1px_0_0_var(--color-border)]"
                    >
                      <tr>
                        @for (col of data.normalized_data.columns; track col) {
                          <th
                            class="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-foreground-muted whitespace-nowrap border-b border-border"
                          >
                            {{ col }}
                          </th>
                        }
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-divider-border">
                      @for (row of data.normalized_data.rows.slice(0, 100); track $index) {
                        <tr class="hover:bg-background-subtle/50 transition-colors">
                          @for (cell of row; track $index) {
                            <td
                              class="px-4 py-2.5 text-[13px] text-foreground whitespace-nowrap max-w-50 truncate"
                              [title]="cell || ''"
                            >
                              {{ cell !== null && cell !== undefined ? cell : "-" }}
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                @if (data.normalized_data.rows.length > 100) {
                  <div
                    class="px-6 py-3 border-t border-border bg-background-subtle text-center text-[12.5px] text-foreground-muted"
                  >
                    Showing the first 100 of {{ data.normalized_data.rows.length }} rows. Download
                    the file to view the complete dataset.
                  </div>
                }
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center py-20 text-center">
                <app-icon name="FileX" [size]="40" class="text-foreground-muted mb-3" />
                <p class="text-[15px] font-medium text-foreground">Data not available</p>
                <p class="text-[13px] text-foreground-muted mt-1">
                  This document might still be processing or failed to parse.
                </p>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class DocumentViewModalComponent {
  @Input() isOpen = false
  @Input() isLoading = false
  @Input() documentName = ""
  @Input() data: any = null

  @Output() close = new EventEmitter<void>()
}
