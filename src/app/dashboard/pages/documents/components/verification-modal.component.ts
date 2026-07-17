import { Component, Input, Output, EventEmitter } from "@angular/core"
import { DatePipe } from "@angular/common"

import { VerificationResponse } from "@services/signature.service"
import { IconComponent } from "@shared/icons/icons.component"

@Component({
  selector: "verification-modal",
  standalone: true,
  imports: [DatePipe, IconComponent],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
        (click)="close.emit()"
      >
        <div
          class="bg-background border border-border rounded-2xl w-full max-w-md mx-4 p-7 shadow-xl transform transition-all"
          (click)="$event.stopPropagation()"
        >
          @if (isLoading) {
            <div class="flex flex-col items-center justify-center py-10 gap-4">
              <div
                class="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin"
              ></div>
              <p class="text-sm font-medium text-foreground-muted">Verifying Signature</p>
            </div>
          }

          @if (!isLoading && result) {
            <div class="flex flex-col items-center text-center">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center mb-4
                {{
                  result.status === 'verified'
                    ? 'bg-success-bg text-success-text'
                    : 'bg-error-bg text-error'
                }}"
              >
                @if (result.status === "verified") {
                  <app-icon name="Check" [size]="32" />
                } @else {
                  <app-icon name="ShieldAlert" [size]="32" />
                }
              </div>

              <h2 class="text-xl font-semibold text-foreground mb-1">
                {{ result.status === "verified" ? "Signature Verified" : "Verification Failed" }}
              </h2>

              <p class="text-[13px] text-foreground-muted mb-6 px-4">
                @if (result.status === "verified") {
                  This document's cryptographic seal is intact. It has not been altered since it was
                  signed.
                } @else {
                  Warning! The document data has been modified since it was signed, or the signature
                  is missing.
                }
              </p>

              @if (result.status === "verified") {
                <div
                  class="w-full bg-background-subtle border border-border rounded-xl p-4 text-left space-y-3 mb-6"
                >
                  <div>
                    <p
                      class="text-[11px] font-medium uppercase tracking-wider text-foreground-muted mb-0.5"
                    >
                      Signed By
                    </p>
                    <p class="text-sm font-medium text-foreground">{{ result.signed_by }}</p>
                  </div>
                  <div>
                    <p
                      class="text-[11px] font-medium uppercase tracking-wider text-foreground-muted mb-0.5"
                    >
                      Timestamp
                    </p>
                    <p class="text-sm font-medium text-foreground">
                      {{ result.signed_at | date: "medium" }}
                    </p>
                  </div>
                </div>
              }

              <button
                (click)="close.emit()"
                class="w-full py-2.5 px-4 mt-3 rounded-lg font-medium text-sm transition-colors cursor-pointer
                  {{
                  result.status === 'verified'
                    ? 'bg-accent text-white hover:bg-accent-hover'
                    : 'bg-error-bg text-error border border-error-border hover:bg-error-bg-hover'
                }}"
              >
                Close
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class VerificationModalComponent {
  @Input() isOpen = false
  @Input() isLoading = false
  @Input() result: VerificationResponse | null = null

  @Output() close = new EventEmitter<void>()
}
