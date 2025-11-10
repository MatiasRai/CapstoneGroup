import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private host = window.location.hostname; // Detecta localhost o IP local

  private apiUrl = `http://${this.host}:3000/api/v1/usuarios`;
  private apiUrlEmpresas = `http://${this.host}:3000/api/v1/empresas`;

  constructor(private http: HttpClient) {}

  /* ======================================================
     👤 USUARIOS NORMALES
  ====================================================== */
  getUsuarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  registrarUsuario(usuario: any): Observable<any> {
    return this.http.post(this.apiUrl, usuario);
  }

  updateUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, usuario);
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getDiscapacidades(): Observable<any[]> {
    const host = window.location.hostname;
    const url = `http://${host}:3000/api/v1/discapacidades`;
    return this.http.get<any[]>(url);
  }

  /* ======================================================
     🏢 EMPRESAS
  ====================================================== */
  getEmpresas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrlEmpresas);
  }

  updateEstadoEmpresa(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrlEmpresas}/${id}/estado`, { estado });
  }

  // 🔹 Nuevo método para eliminar empresa
  deleteEmpresa(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlEmpresas}/${id}`);
  }
}
