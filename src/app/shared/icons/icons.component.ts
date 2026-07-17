import { Component, input } from "@angular/core"
import { LucideAngularModule } from "lucide-angular"
import { APP_ICONS, AppIconName } from "@shared/icons/icons"

@Component({
  selector: "app-icon",
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <lucide-icon [img]="iconData" [size]="size()" [color]="color()" [strokeWidth]="stroke()">
    </lucide-icon>
  `,
})
export class IconComponent {
  name = input.required<AppIconName>()
  size = input<number>(20)
  color = input<string>("currentColor")
  stroke = input<number>(2.1)

  get iconData() {
    return APP_ICONS[this.name()]
  }
}
