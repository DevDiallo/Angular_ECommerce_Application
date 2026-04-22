import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categorie } from '../modeles/categorie';

@Injectable({
  providedIn: 'root',
})
export class CategorieService {
  private readonly apiBase = '/api';

  constructor(private http: HttpClient) {}

  // GET /categories [PUBLIC]
  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiBase}/categories`);
  }

  // GET /categories/{id} [PUBLIC]
  getCategorieById(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${this.apiBase}/categories/${id}`);
  }
}
