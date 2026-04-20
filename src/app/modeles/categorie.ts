import { Produit } from "./produit";

export class Categorie {
    constructor(public id_categorie: number, public categorie_name: String, public produits: Produit[]) { }

}