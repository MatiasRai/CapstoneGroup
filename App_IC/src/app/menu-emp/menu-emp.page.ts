import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButtons, IonButton } from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';

@Component({
  selector: 'app-menu-emp',
  templateUrl: './menu-emp.page.html',
  styleUrls: ['./menu-emp.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IONIC_IMPORTS]
})
export class MenuEMPPage implements OnInit {

  constructor() { }

  // Información de la empresa
  empresa = {
    nombre_empresa: 'Empresa XYZ',
    direccion_empresa: 'Calle Ficticia 123, Ciudad, País',
    telefono: '(555) 123-4567',
    descripcion_empresa: 'Empresa dedicada a la venta de productos electrónicos.',
    horarios: 'Lunes a Viernes, 9:00 AM - 6:00 PM',
    sitio_web: 'https://www.empresa.xyz',
    correo: 'contacto@empresa.xyz'
  };

  // Modo de edición
  editMode = false;

  ngOnInit() {}

  // Activar modo de edición
  edit() {
    this.editMode = true;
  }

  // Guardar los cambios (solo en la UI por ahora)
  save() {
    console.log('Cambios guardados:', this.empresa);
    this.editMode = false;
  }

  // Cancelar la edición y restaurar los datos originales
  cancel() {
    this.editMode = false;
    this.resetData();
  }

  // Restaurar los datos originales en caso de cancelación
  resetData() {
    this.empresa = {
      nombre_empresa: 'Empresa XYZ',
      direccion_empresa: 'Calle Ficticia 123, Ciudad, País',
      telefono: '(555) 123-4567',
      descripcion_empresa: 'Empresa dedicada a la venta de productos electrónicos.',
      horarios: 'Lunes a Viernes, 9:00 AM - 6:00 PM',
      sitio_web: 'https://www.empresa.xyz',
      correo: 'contacto@empresa.xyz'
    };
  }
}
