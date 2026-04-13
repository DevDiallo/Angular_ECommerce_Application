import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Produit } from "../modeles/produit";
import { LigneProduit } from "../modeles/ligneProduit";


@Injectable({
    providedIn: 'root'
})

export class CartProduitService {

    constructor(private http: HttpClient) { }

    getProduits(): Observable<Produit[]> {
        return this.http.get<Produit[]>('http://localhost:3000/produit');
    }
    // get tout les produits du panier
    getCartProduits(): Observable<LigneProduit[]> {
        return this.http.get<LigneProduit[]>('http://localhost:3000/ligneProduit');
    }

    getProduitById(id: number) {
        return this.http.get(`http://localhost:3000/produit/${id}`);
    }

    addProduit(produit: Produit) {
        return this.http.post('http://localhost:3000/produit', produit);
    }
    // ajouter un produit dans le panier
    addToligneProduit(produit: Produit) {
        const prodId = Number(produit.id);
        this.http.get<LigneProduit[]>(`http://localhost:3000/ligneProduit?produitId=${prodId}`).subscribe(ligneProduits => {
            if (ligneProduits.length > 0) {
                const ligneProduit = ligneProduits[0];
                const updatedLigneProduit: LigneProduit = {
                    ...ligneProduit,
                    quantite: ligneProduit.quantite + 1
                };
                this.http.put(`http://localhost:3000/ligneProduit/${ligneProduit.id}`, updatedLigneProduit).subscribe();
            } else {
                const newLigneProduit: LigneProduit = {
                    id: crypto.randomUUID().substring(0, 4),
                    produitId: prodId,
                    quantite: 1
                };
                console.log('Nouveau produit ajouté au panier avec LigneProduit :', newLigneProduit.id);
                this.http.post('http://localhost:3000/ligneProduit', newLigneProduit).subscribe();
            }
        });
    }

    updateProduit(id: number, produit: any) {
        return this.http.put(`http://localhost:3000/produit/${id}`, produit);
    }

    deleteProduit(id: number) {
        return this.http.delete(`http://localhost:3000/produit/${id}`);
    }
}