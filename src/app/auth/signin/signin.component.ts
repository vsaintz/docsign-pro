import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { Router, RouterLink } from "@angular/router"
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"

import { AuthService } from "@services/auth.service"
import { AuthBanner } from "@auth/components/auth-banner.component"

@Component({
  selector: "app-signin",
  imports: [CommonModule, ReactiveFormsModule, AuthBanner, RouterLink],
  templateUrl: "./signin.component.html",
})
export class SigninComponent {
  signinForm: FormGroup
  errorMessage: string = ""

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.signinForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
    })
  }

  onSubmit() {
    this.errorMessage = ""

    if (this.signinForm.valid) {
      const payload = {
        email: this.signinForm.value.email,
        password: this.signinForm.value.password,
      }

      this.authService.signin(payload).subscribe({
        next: (response) => {
          console.log("Login success")
          this.router.navigate(["/dashboard"])
        },
        error: (err) => {
          console.error("Connection error: ", err)
          this.errorMessage =
            err.error?.detail || err.error?.non_field_errors?.[0] || "Invalid email or password"
        },
      })
    } else {
      this.signinForm.markAllAsTouched()
      this.errorMessage = "Please fill in all required fields"
    }
  }
}
