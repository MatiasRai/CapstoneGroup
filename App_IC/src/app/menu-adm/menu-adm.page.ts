import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonButtons } from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { UsuarioService } from 'src/app/services/usuario.service';  // 👈 importa el service

@Component({
  selector: 'app-menu-adm',
  templateUrl: './menu-adm.page.html',
  styleUrls: ['./menu-adm.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonButtons, CommonModule, FormsModule, IONIC_IMPORTS]
})
export class MenuADMPage implements OnInit {

  usuarios: any[] = [];   // 👈 aquí guardaremos los usuarios reales

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe(data => {
      this.usuarios = data;
    });
  }

  eliminarUsuario(id: number) {
    this.usuarioService.deleteUsuario(id).subscribe(() => {
      this.cargarUsuarios();
    });
  }
}
