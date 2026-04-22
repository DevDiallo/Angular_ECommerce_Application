export interface CommandeItem {
  produitId: number;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
}

export interface Commande {
  id: string;
  dateValidation: string;
  total: number;
  items: CommandeItem[];
}
