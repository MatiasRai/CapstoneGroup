import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdmEmpresaService {

private apiUrlAdm = 'http://localhost:3000/api/v1/adm_empresa';  // ✅ Endpoint para administradores de empresa
private apiUrlEmpresas = 'http://localhost:3000/api/v1/empresas'; // ✅ Endpoint para empresas
private apiUrl = 'http://localhost:3000/api/v1/login';            // ✅ Endpoint para login
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
