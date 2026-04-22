import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { BarreFiltrageComponent } from './barre-filtrage/barre-filtrage.component';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, BarreFiltrageComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'E_Commerce_Application';
}
