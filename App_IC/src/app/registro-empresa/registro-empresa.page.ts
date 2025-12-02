import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from 'src/app/services/adm-empresa.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-registro-empresa',
  templateUrl: './registro-empresa.page.html',
  styleUrls: ['./registro-empresa.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IONIC_IMPORTS,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonButton
  ]
})
export class RegistroEmpresaPage {

  empresa = {
    nombre_empresa: '',
    direccion_empresa: '',
    telefono: '',
    descripcion_empresa: '',
    horarios: '',
    sitio_web: '',
    Correo: '',
    Estado: 'Proceso',
    Adm_Empresa_id_adm_Empresa: 0
  };

  constructor(
    private route: ActivatedRoute,
    private admEmpService: AdmEmpresaService
  ) {
    this.route.queryParams.subscribe(params => {
      const idFromUrl = params['id_adm_Empresa'];
      const idFromStorage = localStorage.getItem('id_adm_Empresa');
      const id = Number(idFromUrl ?? idFromStorage ?? 0);
      this.empresa.Adm_Empresa_id_adm_Empresa = id;
    });
  }

  
  private validarCampos(): string | null {

    
    const telRegex = /^(\+?56)?\s?9?\s?\d{8}$/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    
    const urlRegex = /^(https?:\/\/)?([\w\-]+\.)+\w{2,}(\/\S*)?$/;

    if (!this.empresa.nombre_empresa.trim())
      return "El nombre de la empresa es obligatorio.";

    if (!this.empresa.direccion_empresa.trim())
      return "La dirección es obligatoria.";

    if (!this.empresa.telefono.trim() || !telRegex.test(this.empresa.telefono))
      return "Teléfono inválido. Ej: +56912345678 o 912345678.";

    if (!this.empresa.descripcion_empresa.trim() || this.empresa.descripcion_empresa.length < 10)
      return "La descripción debe tener al menos 10 caracteres.";

    if (!this.empresa.horarios.trim())
      return "Los horarios son obligatorios.";

    
    if (this.empresa.sitio_web.trim().length > 0 && !urlRegex.test(this.empresa.sitio_web))
      return "El sitio web no tiene un formato válido.";

    if (!this.empresa.Correo.trim() || !emailRegex.test(this.empresa.Correo))
      return "Correo inválido.";

    return null; 
  }

  
  onRegistrar() {

    if (!this.empresa.Adm_Empresa_id_adm_Empresa) {
      alert('Falta el ID del administrador. Registra el admin primero.');
      return;
    }

    const error = this.validarCampos();
    if (error) {
      alert("⚠️ " + error);
      return;
    }

    this.admEmpService.registrarEmpresa(this.empresa).subscribe({
      next: (res) => {
        alert('✅ Empresa registrada con éxito');
        console.log(res);
      },
      error: (err) => {
        alert('❌ Error al registrar empresa');
        console.error(err);
      }
    });
  }
}
