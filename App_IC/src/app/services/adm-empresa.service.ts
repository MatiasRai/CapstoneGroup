import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdmEmpresaService {

  private baseHost = window.location.hostname;  // Detecta localhost o tu IP local
  private apiUrlAdm = `http://${this.baseHost}:3000/api/v1/adm_empresa`;
  private apiUrlEmpresas = `http://${this.baseHost}:3000/api/v1/empresas`;
  private apiUrlLogin = `http://${this.baseHost}:3000/api/v1/login`;
  private apiUrlServicios = `http://${this.baseHost}:3000/api/v1/servicios`;

  constructor(private http: HttpClient) {}

  // ✅ Registrar un administrador de empresa
  registrarAdmEmpresa(data: any): Observable<any> {
    return this.http.post(this.apiUrlAdm, data);
  }

  // ✅ Hacer login (admin empresa o usuario)
  login(credenciales: { correo: string; contrasena: string }): Observable<any> {
    return this.http.post(this.apiUrlLogin, credenciales);
  }

  // ✅ Registrar una empresa vinculada a un administrador
  registrarEmpresa(data: any): Observable<any> {
    return this.http.post(this.apiUrlEmpresas, data);
  }

  // ✅ Publicar un nuevo servicio (admin empresa)
  publicarServicio(data: any): Observable<any> {
    return this.http.post(this.apiUrlServicios, data);
  }

  // ✅ Obtener los servicios publicados por una empresa
  obtenerServiciosPorEmpresa(id_empresa: number): Observable<any> {
    return this.http.get(`${this.apiUrlServicios}/${id_empresa}`);
  }
}
