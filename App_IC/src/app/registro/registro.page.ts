import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';

import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButton, IonInput, IonItem, IonLabel, IonList,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { UsuarioService } from '../services/usuario.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonInput, IonItem, IonLabel, IonList,
    IonSelect, IonSelectOption,
    CommonModule, FormsModule, IONIC_IMPORTS
  ]
})
export class RegistroPage implements OnInit {

  usuario = {
    nombre: '',
    correo: '',
    contrasena: '',
    celular: '',
    foto_perfil: '',
    Discapacidades_id_discapacidad: null
  };

  fotoFile: File | null = null;
  discapacidades: any[] = [];

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuarioService.getDiscapacidades().subscribe({
      next: (data) => {
        this.discapacidades = data;
      },
      error: (err) => {
        console.error('Error cargando discapacidades:', err);
      }
    });
  }

  
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    this.fotoFile = file ?? null;

    
    this.usuario.foto_perfil = this.fotoFile ? this.fotoFile.name : '';
  }

  
  onRegistrar() {
    this.usuarioService.registrarUsuario(this.usuario).subscribe({
      next: (res: any) => {
        alert('Usuario registrado exitosamente');
        console.log('Usuario creado:', res);

        
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al registrar usuario:', err);
        alert('❌ Error al registrar usuario');
      }
    });
  }
}
