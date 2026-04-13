export class Produit {
    constructor(
        public id: number,
        public nom: string,
        public description: string,
        public prix: number,
        public imagePath: string,
        public categorieId: number
    ) { }
}