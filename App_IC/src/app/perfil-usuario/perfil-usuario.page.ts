import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonAvatar, IonItem, IonLabel, IonList,
  IonButton, IonIcon
} from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.page.html',
  styleUrls: ['./perfil-usuario.page.scss'],
  standalone: true,
  imports: [
    CommonModule, HttpClientModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonAvatar, IonItem, IonLabel, IonList, IonButton, IonIcon,
    ...IONIC_IMPORTS
  ]
})
export class PerfilUsuarioPage implements OnInit {
  user: any = null;
  apiUrl = 'http://localhost:3000/api/v1/usuarios';

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    const u = this.auth.getUser();
    if (u?.id) this.loadUserData(u.id);
  }

  loadUserData(id: number) {
    this.http.get(`${this.apiUrl}/${id}`).subscribe({
      next: (res: any) => { this.user = res; },
      error: (err) => { console.error('❌ Error al obtener perfil:', err); }
    });
  }
}
