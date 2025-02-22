import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
 import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule,  ],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  breadcrumbs: any[] = [];
  private routerSubscription!: Subscription;
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Reinitialize breadcrumbs at each route change
        this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
      });
    this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
  }

  createBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: any[] = []
  ): any[] {
    let prevBreadCrumb = [];
    let currentRoute = route;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
      const routeURL: string = currentRoute.snapshot.url
        .map((segment) => segment.path)
        .join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }
      const breadcrumbData = currentRoute.snapshot.data['breadcrumbs'];
      if (
        breadcrumbData &&
        breadcrumbData != prevBreadCrumb &&
        Array.isArray(breadcrumbData) &&
        routeURL !== ''
      ) {
        prevBreadCrumb = breadcrumbData;
        const breadcrumbSegments = breadcrumbData.map((segment) => ({
          label: segment.label,
          url: segment.url || url,
        }));
        breadcrumbs.push({ segments: breadcrumbSegments });
      }
    }

    return breadcrumbs;
  }

  ngOnDestroy() {}
}
