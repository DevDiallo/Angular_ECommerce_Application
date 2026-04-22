import { Produit } from "./produit";
export class LigneStock {
    public id: string;
    public stock_id: number;
    public produit: Produit;
    public quantite_stock: number;

    constructor(id: string, stock_id: number, produit: Produit, quantite_stock: number) {
        this.id = id;
        this.stock_id = stock_id;
        this.produit = produit;
        this.quantite_stock = quantite_stock;
    }
}