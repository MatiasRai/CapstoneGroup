import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private host = window.location.hostname;

  private apiUsuarios = `http://${this.host}:3000/api/v1/usuarios`;
  private apiEmpresas = `http://${this.host}:3000/api/v1/empresas`;
  private apiDiscapacidades = `http://${this.host}:3000/api/v1/discapacidades`;

  constructor(private http: HttpClient) {}

  /* ======================================================
     👤 USUARIOS — CRUD
  ====================================================== */

  // Obtener todos los usuarios (sin paginar)
  getUsuarios(): Observable<any> {
    return this.http.get(this.apiUsuarios);
  }

  // ✔ NUEVO: Usuarios paginados
  getUsuariosPaginados(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUsuarios}/paginados?page=${page}&limit=${limit}`);
  }

  registrarUsuario(usuario: any): Observable<any> {
    return this.http.post(this.apiUsuarios, usuario);
  }

  updateUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put(`${this.apiUsuarios}/${id}`, usuario);
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUsuarios}/${id}`);
  }

  /* ======================================================
     🦽 DISCAPACIDADES
  ====================================================== */
  getDiscapacidades(): Observable<any[]> {
    return this.http.get<any[]>(this.apiDiscapacidades);
  }

  /* ======================================================
     🏢 EMPRESAS — CRUD
  ====================================================== */

  getEmpresas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiEmpresas);
  }

  // ✔ NUEVO: Empresas paginadas
  getEmpresasPaginadas(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiEmpresas}/paginadas?page=${page}&limit=${limit}`);
  }

  updateEstadoEmpresa(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiEmpresas}/${id}/estado`, { estado });
  }

  deleteEmpresa(id: number): Observable<any> {
    return this.http.delete(`${this.apiEmpresas}/${id}`);
  }
}
