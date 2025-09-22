import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from 'src/app/services/adm-empresa.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-registro-empresa',
  templateUrl: './registro-empresa.page.html',
  styleUrls: ['./registro-empresa.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IONIC_IMPORTS,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonItem, IonLabel, IonInput, IonButton
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
  Estado: 'proceso',
  Adm_Empresa_id_adm_Empresa: 0
};

constructor(private route: ActivatedRoute, private admEmpService: AdmEmpresaService) {
  this.route.queryParams.subscribe(params => {
    const idFromUrl = params['id_adm_Empresa'];
    const idFromStorage = localStorage.getItem('id_adm_Empresa');
    const id = Number(idFromUrl ?? idFromStorage ?? 0);
    this.empresa.Adm_Empresa_id_adm_Empresa = id;
  });
}

onRegistrar() {
  if (!this.empresa.Adm_Empresa_id_adm_Empresa) {
    alert('Falta el ID del administrador. Registra el admin primero.');
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