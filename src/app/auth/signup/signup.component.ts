import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { Router, RouterLink } from "@angular/router"
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"

import { AuthService } from "@services/auth.service"
import { AuthBanner } from "@auth/components/auth-banner.component"

@Component({
  selector: "app-signup",
  imports: [CommonModule, ReactiveFormsModule, AuthBanner, RouterLink],
  templateUrl: "./signup.component.html",
})
export class SignupComponent {
  signupForm: FormGroup
  errorMessage: string = ""

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.signupForm = this.formBuilder.group({
      first_name: ["", Validators.required],
      middle_name: [""],
      last_name: ["", Validators.required],
      phone_number: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
    })
  }

  onSubmit() {
    this.errorMessage = ""

    if (this.signupForm.valid) {
      const payload = {
        first_name: this.signupForm.value.first_name,
        middle_name: this.signupForm.value.middle_name,
        last_name: this.signupForm.value.last_name,
        phone_number: this.signupForm.value.phone_number,
        email: this.signupForm.value.email,
        password: this.signupForm.value.password,
      }

      this.authService.signup(payload).subscribe({
        next: (response) => {
          console.log("Signup success: ", response)
          this.router.navigate(["/auth/signin"])
        },
        error: (err) => {
          this.errorMessage =
            err.error?.detail ||
            err.error?.message ||
            "Registration failed. Please check your details and try again."
        },
      })
    } else {
      this.signupForm.markAllAsTouched()
      this.errorMessage = "Please fill in all required fields"
    }
  }
}
