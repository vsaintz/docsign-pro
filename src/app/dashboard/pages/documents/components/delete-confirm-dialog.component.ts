import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnChanges,
  SimpleChanges,
} from "@angular/core"

@Component({
  selector: "delete-confirm-dialog",
  standalone: true,
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        (click)="cancel()"
      >
        <div
          class="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-150"
          [class.opacity-0]="animatingOut()"
          [class.opacity-100]="!animatingOut()"
        ></div>
        <div
          class="relative z-10 w-full max-w-sm bg-background border border-border rounded-2xl shadow-xl p-6 transition-all duration-180"
          [class.opacity-0]="animatingOut()"
          [class.opacity-100]="!animatingOut()"
          [class.translate-y-2]="animatingOut()"
          [class.translate-y-0]="!animatingOut()"
          [class.scale-95]="animatingOut()"
          [class.scale-100]="!animatingOut()"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-[15px] font-medium mb-1.5">{{ title }}</h2>
          <p class="text-[13px] text-foreground-muted leading-relaxed mb-6 font-light">
            @if (deleteCount === 1 && documentName) {
              <span class="font-medium">{{ documentName }}</span>
              will be permanently deleted and cannot be recovered.
            } @else if (deleteCount === 1) {
              This document will be permanently deleted and cannot be recovered.
            } @else {
              {{ deleteCount }} documents will be permanently deleted and cannot be recovered.
            }
          </p>
          <div class="flex items-center gap-2.5">
            <button
              (click)="cancel()"
              class="flex-1 px-4 py-2.5 text-[13px] font-medium rounded-xl border border-border bg-background text-foreground-muted hover:text-foreground hover:bg-hover-background transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              (click)="confirm()"
              class="flex-1 px-4 py-2.5 text-[13px] font-medium rounded-xl bg-error-bg text-error hover:bg-error-bg-hover border border-error-border transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DeleteConfirmDialogComponent implements OnChanges {
  @Input() deleteCount = 0
  @Input() documentName = ""
  @Output() confirmed = new EventEmitter<void>()
  @Output() cancelled = new EventEmitter<void>()
  visible = signal(false)
  animatingOut = signal(false)
  ngOnChanges(changes: SimpleChanges) {
    if (changes["deleteCount"]) {
      if (this.deleteCount > 0) {
        this.animatingOut.set(false)
        this.visible.set(true)
      }
    }
  }
  get title(): string {
    return this.deleteCount === 1 ? "Delete document?" : `Delete ${this.deleteCount} documents?`
  }
  confirm() {
    this.close()
    this.confirmed.emit()
  }
  cancel() {
    this.close()
    this.cancelled.emit()
  }
  private close() {
    this.animatingOut.set(true)
    setTimeout(() => {
      this.visible.set(false)
      this.animatingOut.set(false)
    }, 180)
  }
}
