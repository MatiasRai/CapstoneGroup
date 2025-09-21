import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/usuarios';
  

  constructor(private http: HttpClient) {}
  ///Usuarios normales ////
  getUsuarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  registrarUsuario(usuario: any) {
  return this.http.post(this.apiUrl, usuario);
}
  updateUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, usuario);
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getDiscapacidades(): Observable<any[]> {
  return this.http.get<any[]>('http://localhost:3000/discapacidades');
}
 ///Usuarios normales ////

 
}
