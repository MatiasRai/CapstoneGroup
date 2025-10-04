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
  imports: [CommonModule, FormsModule, IONIC_IMPORTS]
})
export class MenuEMPPage implements OnInit {
  empresa: any = null;
  servicios: any[] = []; // ✅ arreglo para los servicios

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.recargarDatos(); // 🔁 carga inicial de empresa + servicios
  }

  // 🔄 Cargar empresa y sus servicios
  recargarDatos() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogeado') || '{}');

    if (!usuario?.id) {
      console.warn('⚠️ No se encontró usuario logeado en localStorage');
      return;
    }

    const id = usuario.id;

    // ✅ Obtener datos de la empresa
    this.http
      .get(`http://localhost:3000/api/v1/empresas/admin/${id}`)
      .subscribe({
        next: (res) => {
          this.empresa = res;
          console.log('🏢 Empresa cargada:', res);
        },
        error: (err) => {
          console.error('❌ Error al obtener empresa:', err);
        },
      });

    // ✅ Obtener servicios de la empresa
    this.http
      .get(`http://localhost:3000/api/v1/empresas/admin/${id}/servicios`)
      .subscribe({
        next: (res: any) => {
          this.servicios = res;
          console.log('🧾 Servicios cargados:', res);
        },
        error: (err) => {
          console.error('❌ Error al obtener servicios:', err);
          this.servicios = []; // Evita errores si no hay datos
        },
      });
  }
}
