import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { RouterOutlet } from '@angular/router';
import { SideNavComponent } from "../side-nav/side-nav.component";
import { SidebarService } from '../../shared/services/sidebar.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-internal',
  imports: [NavbarComponent, RouterOutlet, SideNavComponent,CommonModule],
  templateUrl: './main-internal.component.html',
  styleUrl: './main-internal.component.scss'
})
export class MainInternalComponent {
  constructor(public sidebarService: SidebarService) {}

}
