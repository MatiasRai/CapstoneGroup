import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';


@Component({
  selector: 'app-login-emp',
  templateUrl: './login-emp.page.html',
  styleUrls: ['./login-emp.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IONIC_IMPORTS]
})
export class LoginEMPPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
