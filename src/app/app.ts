import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('xaltheris');

  constructor(private router: Router) { }

  navigateTo(link: string) {
    if ((this as any).router?.navigateByUrl) {
      this.router.navigateByUrl(link);
    } else {
      location.assign(link);
    }
  }
}
