import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdmEmpresaService {
  private apiUrl = 'http://localhost:3000/adm_empresa'; // 👈 tu backend

  constructor(private http: HttpClient) {}

  // Registrar administrador de empresa
  registrarAdmEmpresa(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
