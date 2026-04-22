export interface Client {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  roles?: string[];
}
