import { Component, Input, Output, EventEmitter } from "@angular/core"
import { IconComponent } from "@shared/icons/icons.component"

export type SortField = "name" | "date" | "size" | "status" | "signature"
export type FilterStatus = "all" | "ready" | "error" | "signed" | "unsigned"

@Component({
  selector: "document-toolbar",
  standalone: true,
  imports: [IconComponent],
  templateUrl: "./document-toolbar.component.html",
})
export class DocumentToolbarComponent {
  @Input() totalCount = 0
  @Input() selectedCount = 0
  @Input() searchQuery = ""
  @Input() activeFilter: FilterStatus = "all"
  @Input() sortField: SortField = "date"

  @Output() clearSelection = new EventEmitter<void>()
  @Output() downloadSelected = new EventEmitter<void>()
  @Output() deleteSelected = new EventEmitter<void>()
  @Output() searchChange = new EventEmitter<string>()
  @Output() filterChange = new EventEmitter<FilterStatus>()
  @Output() sortChange = new EventEmitter<SortField>()

  readonly filterOptions: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Ready", value: "ready" },
    { label: "Signed", value: "signed" },
    { label: "Unsigned", value: "unsigned" },
    { label: "Error", value: "error" },
  ]
}
