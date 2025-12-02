import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdmEmpresaService {

  private baseHost = window.location.hostname; 

  private apiUrlAdm = `http://${this.baseHost}:3000/api/v1/adm_empresa`;
  private apiUrlEmpresas = `http://${this.baseHost}:3000/api/v1/empresas`;
  private apiUrlLogin = `http://${this.baseHost}:3000/api/v1/login`;
  private apiUrlServicios = `http://${this.baseHost}:3000/api/v1/servicios`;

  constructor(private http: HttpClient) {}

  /* ======================================================
     👨‍💼 ADMINISTRADOR DE EMPRESA
  ====================================================== */

  registrarAdmEmpresa(data: any): Observable<any> {
    return this.http.post(this.apiUrlAdm, data);
  }

  login(credenciales: { correo: string; contrasena: string }): Observable<any> {
    return this.http.post(this.apiUrlLogin, credenciales);
  }

  /* ======================================================
     🏢 EMPRESAS
  ====================================================== */

  registrarEmpresa(data: any): Observable<any> {
    return this.http.post(this.apiUrlEmpresas, data);
  }

  obtenerEmpresaPorAdm(id_adm_empresa: number): Observable<any> {
    return this.http.get(`${this.apiUrlEmpresas}/admin/${id_adm_empresa}`);
  }

  /* ======================================================
     🧩 SERVICIOS
  ====================================================== */

  // Crear nuevo servicio
  publicarServicio(data: any): Observable<any> {
    return this.http.post(this.apiUrlServicios, data);
  }

  // Obtener todos los servicios de una empresa
  obtenerServiciosPorEmpresa(id_empresa: number): Observable<any> {
    return this.http.get(`${this.apiUrlServicios}/${id_empresa}`);
  }

  // 🆕 Obtener TODOS los servicios disponibles (para menú principal)
  obtenerTodosLosServicios(): Observable<any> {
    return this.http.get(`${this.apiUrlServicios}/todos/disponibles`);
  }

  // Obtener un servicio específico (para edición)
  obtenerServicioPorId(id_servicio: number): Observable<any> {
    return this.http.get(`${this.apiUrlServicios}/detail/${id_servicio}`);
  }

  // Editar servicio existente
  editarServicio(id_servicio: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrlServicios}/${id_servicio}`, data);
  }

  // Eliminar servicio
  eliminarServicio(id_servicio: number): Observable<any> {
    return this.http.delete(`${this.apiUrlServicios}/${id_servicio}`);
  }
}