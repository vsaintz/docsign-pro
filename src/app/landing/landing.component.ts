import { Component } from "@angular/core"

import { NavigationComponent } from "@shared/components/navigation.component"
import { HeroComponent } from "@landing/components/hero.component"
import { FooterComponent } from "@landing/components/footer.component"

@Component({
  selector: "app-landing",
  imports: [NavigationComponent, HeroComponent, FooterComponent],
  templateUrl: "./landing.component.html",
})
export class LandingComponent {}
