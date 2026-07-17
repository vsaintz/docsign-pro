import { Component, Input } from "@angular/core"

@Component({
  selector: "svg-folder-icon",
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 38 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 6C2 4.34 3.34 3 5 3H13.5C14.33 3 15.11 3.37 15.64 4.01L17.16 5.86C17.69 6.5 18.47 6.87 19.3 6.87H33C34.66 6.87 36 8.21 36 9.87V28C36 29.66 34.66 31 33 31H5C3.34 31 2 29.66 2 28V6Z"
        [attr.fill]="stroke"
      />
      <path
        d="M2 12C2 10.34 3.34 9 5 9H33C34.66 9 36 10.34 36 12V28C36 29.66 34.66 31 33 31H5C3.34 31 2 29.66 2 28V12Z"
        [attr.fill]="fill"
      />
    </svg>
  `,
})
export class SvgFolderIconComponent {
  @Input({ required: true }) stroke!: string
  @Input({ required: true }) fill!: string
  @Input() size: number = 38
}
