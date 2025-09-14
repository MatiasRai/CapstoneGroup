import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';

@Component({
  selector: 'app-login-empresa',
  templateUrl: './login-empresa.page.html',
  styleUrls: ['./login-empresa.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IONIC_IMPORTS]
})
export class LoginEmpresaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
