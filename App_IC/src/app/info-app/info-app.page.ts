import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { Router } from '@angular/router';

@Component({
  selector: 'app-info-app',
  templateUrl: './info-app.page.html',
  styleUrls: ['./info-app.page.scss'],
  standalone: true,
  imports: [CommonModule, ...IONIC_IMPORTS],
})
export class InfoAppPage {
  constructor(private router: Router) {}

  irRegistroEmpresa() {
    this.router.navigate(['/registro-adm-empresa']);
  }

  irPublicarServicio() {
    this.router.navigate(['/publicar-servicio']);
  }

  irCrearRuta() {
    this.router.navigate(['/menu']); // o la página donde creas rutas
  }
}

