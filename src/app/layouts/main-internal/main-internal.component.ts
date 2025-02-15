import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { RouterOutlet } from '@angular/router';
import { SideNavComponent } from "../side-nav/side-nav.component";

@Component({
  selector: 'app-main-internal',
  imports: [NavbarComponent, RouterOutlet, SideNavComponent],
  templateUrl: './main-internal.component.html',
  styleUrl: './main-internal.component.scss'
})
export class MainInternalComponent {

}
