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
  
  // Objeto usuario con todos los campos de la tabla
  usuario = {
    nombre: '',
    correo: '',
    contrasena: '',
    celular: '',
    foto_perfil: '',
    Discapacidades_id_discapacidad: null
  };

  discapacidades: any[] = [];   // 👈 Aquí guardaremos lo que venga de la BD

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    // Llamamos al service para traer las discapacidades al cargar la página
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
    const file = event.target.files && event.target.files[0];
      if (file) {
        this.usuario.foto_perfil = file.name; // 👈 solo guardamos el nombre
      } else {
        this.usuario.foto_perfil = ''; // 👈 evitamos undefined
      }
  }
  onRegistrar() {
    this.usuarioService.registrarUsuario(this.usuario).subscribe({
      next: (res: any) => {
        alert(`✅ Usuario registrado: ${res.nombre}`);
        console.log('Usuario creado:', res);
        // Aquí puedes redirigir a otra página si quieres
      },
      error: (err) => {
        alert('❌ Error al registrar usuario');
        console.error(err);
      }
    });
  }
}
