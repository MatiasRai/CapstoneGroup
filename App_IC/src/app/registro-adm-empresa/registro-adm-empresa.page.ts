import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from 'src/app/services/adm-empresa.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-adm-empresa',
  templateUrl: './registro-adm-empresa.page.html',
  styleUrls: ['./registro-adm-empresa.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IONIC_IMPORTS,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonItem, IonLabel, IonInput, IonButton
  ]
})
export class RegistroAdmEmpresaPage {
  admEmpresa = {
    correo: '',
    contrasena: ''
  };

  constructor(
    private admEmpresaService: AdmEmpresaService,
    private router: Router
  ) {}

  onRegistrar() {
    this.admEmpresaService.registrarAdmEmpresa(this.admEmpresa).subscribe({
      next: (res) => {
        // El backend puede devolver id_adm_empresa o id_adm_Empresa (aseguramos ambos)
        const id = res?.id_adm_empresa ?? res?.id_adm_Empresa;
        if (!id) {
          alert('No se recibió el ID del administrador. Revisa la respuesta del backend.');
          console.error('Respuesta sin ID:', res);
          return;
        }

        // Guarda el ID para usarlo en el registro de la empresa
        localStorage.setItem('id_adm_Empresa', String(id));

        // Redirige a la página de registro de empresa con el ID como query param (por si lo quieres leer también desde la URL)
        this.router.navigate(['/registro-empresa'], {
          queryParams: { id_adm_Empresa: id }
        });
      },
      error: (err) => {
        alert('❌ Error al registrar administrador');
        console.error('Error backend:', err);
      }
    });
  }
}
