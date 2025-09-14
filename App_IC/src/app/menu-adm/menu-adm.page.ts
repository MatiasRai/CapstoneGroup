import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
@Component({
  selector: 'app-menu-adm',
  templateUrl: './menu-adm.page.html',
  styleUrls: ['./menu-adm.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IONIC_IMPORTS]
})
export class MenuADMPage implements OnInit {

  constructor() { }
    // Variables que simulan los datos de las empresas con su estado
  empresas = [
    {
      id: 1,
      nombre: 'Empresa 1',
      descripcion: 'Descripción de la empresa 1.',
      telefono: '(123) 456-7890',
      correo: 'empresa1@correo.com',
      horarios: 'Lunes a Viernes, 9:00 AM - 5:00 PM',
      sitioWeb: 'https://www.empresa1.com',
      estado: 'Aprobado'
    },
    {
      id: 2,
      nombre: 'Empresa 2',
      descripcion: 'Descripción de la empresa 2.',
      telefono: '(987) 654-3210',
      correo: 'empresa2@correo.com',
      horarios: 'Lunes a Viernes, 8:00 AM - 4:00 PM',
      sitioWeb: 'https://www.empresa2.com',
      estado: 'Pendiente'
    },
    {
      id: 3,
      nombre: 'Empresa 3',
      descripcion: 'Descripción de la empresa 3.',
      telefono: '(555) 123-4567',
      correo: 'empresa3@correo.com',
      horarios: 'Lunes a Viernes, 10:00 AM - 6:00 PM',
      sitioWeb: 'https://www.empresa3.com',
      estado: 'Rechazado'
    }
  ];
  getEstadoClass(estado: string): string {
  switch(estado) {
    case 'Aprobado': return 'Aprobado';
    case 'Pendiente': return 'Pendiente';
    case 'Rechazado': return 'Rechazado';
    default: return '';
  }
}

  // Función para cambiar el estado de manera visual
  changeEstado(empresaId: number, nuevoEstado: string) {
    // Encontrar la empresa por su ID y actualizar el estado
    const empresa = this.empresas.find(emp => emp.id === empresaId);
    if (empresa) {
      empresa.estado = nuevoEstado;
    }
  }

  ngOnInit() {
  }

}
