import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';

@Component({
  selector: 'app-menu-emp',
  templateUrl: './menu-emp.page.html',
  styleUrls: ['./menu-emp.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IONIC_IMPORTS] // ✅ limpio y sin duplicados
})
export class MenuEMPPage implements OnInit {
  empresa: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogeado') || '{}');

    if (usuario?.id) {
      this.http
        .get(`http://localhost:3000/api/v1/empresas/admin/${usuario.id}`)
        .subscribe({
          next: (res) => (this.empresa = res),
          error: (err) => console.error('Error al obtener empresa:', err)
        });
    } else {
      console.warn('⚠️ No se encontró usuario logeado en localStorage');
    }
  }
}
