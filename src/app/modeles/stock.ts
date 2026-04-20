import { LigneStock } from './ligneStock';

export class Stock {
    constructor(public id: number, public lignesStock: LigneStock[], public date_stock: Date) { }
}

