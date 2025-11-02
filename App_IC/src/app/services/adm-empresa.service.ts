import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdmEmpresaService {

private baseHost = window.location.hostname;  // detecta localhost o tu IP local
private apiUrlAdm = `http://${this.baseHost}:3000/api/v1/adm_empresa`;
private apiUrlEmpresas = `http://${this.baseHost}:3000/api/v1/empresas`;
private apiUrl = `http://${this.baseHost}:3000/api/v1/login`;
 
        // ✅ Endpoint para login
  constructor(private http: HttpClient) {}

  // 👉 Registrar un administrador de empresa
  registrarAdmEmpresa(data: any): Observable<any> {
    return this.http.post(this.apiUrlAdm, data);
  }
    // Método para hacer login
  login(credenciales: { correo: string; contrasena: string }): Observable<any> {
    return this.http.post(this.apiUrl, credenciales);
  }
  // 👉 Registrar una empresa vinculada a un administrador
  registrarEmpresa(data: any): Observable<any> {
    return this.http.post(this.apiUrlEmpresas, data);
  }
}
