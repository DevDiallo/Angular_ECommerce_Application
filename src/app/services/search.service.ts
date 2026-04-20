import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Produit } from '../modeles/produit';

@Injectable({
    providedIn: 'root'
})
export class SearchService {

    private produitsSubject = new BehaviorSubject<Produit[]>([]);
    produits$ = this.produitsSubject.asObservable();

    setProduits(produits: Produit[]) {
        this.produitsSubject.next(produits);
    }

    clearProduits() {
        this.produitsSubject.next([]);
    }
}