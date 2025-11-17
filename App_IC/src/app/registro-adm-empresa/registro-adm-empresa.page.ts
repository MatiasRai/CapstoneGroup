import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonItem, IonLabel, IonInput, IonButton 
} from '@ionic/angular/standalone';
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

  // ============================
  //   VALIDACIONES MANUALES
  // ============================
  validarCampos(): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!this.admEmpresa.correo.trim()) {
      return "El correo es obligatorio.";
    }

    if (!emailRegex.test(this.admEmpresa.correo)) {
      return "El correo no tiene un formato válido.";
    }

    if (!this.admEmpresa.contrasena.trim()) {
      return "La contraseña es obligatoria.";
    }

    if (this.admEmpresa.contrasena.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }

    return null; // Todo válido
  }

  // ============================
  //   REGISTRAR ADMIN
  // ============================
  onRegistrar() {

    // ❗ Validar antes de enviar
    const error = this.validarCampos();
    if (error) {
      alert("⚠️ " + error);
      return;
    }

    this.admEmpresaService.registrarAdmEmpresa(this.admEmpresa).subscribe({
      next: (res) => {

        const id = res?.id_adm_empresa ?? res?.id_adm_Empresa;

        if (!id) {
          alert('❌ No se recibió el ID del administrador. Revisa el backend.');
          console.error('Respuesta sin ID:', res);
          return;
        }

        // Guardar para usar luego en el registro de empresa
        localStorage.setItem('id_adm_Empresa', String(id));

        // Redirigir
        this.router.navigate(['/registro-empresa'], {
          queryParams: { id_adm_Empresa: id }
        });
      },
      error: (err) => {
        alert('❌ Error al registrar administrador');
        console.error('Backend error:', err);
      }
    });
  }
}
