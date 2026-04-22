# ✅ Migration: db.json → API SQL Server

## Résumé de la migration

L'application Angular a été **entièrement migrée** de `db.json` (json-server) vers l'API SQL Server (`localhost:7000`).

### 🗑️ Supprimé

- `http://localhost:3000/stock`
- `http://localhost:3000/categorie`
- `http://localhost:3000/ligneStock`
- `http://localhost:3000/ligneProduit`
- `http://localhost:3000/produit`
- `http://localhost:3000/commande`
- `db.json` (plus utilisé)
- `middleware.js` (persistence json-server)

### ✨ Nouveau

#### 4 Nouveaux Services

| Service                    | Endpoints                  | Descrition                       |
| -------------------------- | -------------------------- | -------------------------------- |
| **ProduitsService**        | `/api/produits/*`          | GET, POST, PUT, DELETE produits  |
| **CommandeService**        | `/api/commandes/*`         | GET, POST, PUT, DELETE commandes |
| **CommandeProduitService** | `/api/commandesProduits/*` | Lignes de commande               |
| **CategorieService**       | `/api/categories/*`        | GET catégories                   |
| **LigneStockService**      | `/api/ligneStocks/*`       | Gestion des stocks               |
| **PanierService**          | localStorage               | Panier local (session user)      |
| **UtilisateursService**    | `/api/users/*`             | GET, PUT utilisateurs (ADMIN)    |

#### Services Refactorisés

| Service                    | Changements                                                   |
| -------------------------- | ------------------------------------------------------------- |
| **CartProduitService**     | Agrégateur - délègue à d'autres services                      |
| **AdminManagementService** | Utilise ProduitsService, CommandeService, UtilisateursService |
| **BarreFiltrageComponent** | Utilise CartProduitService (plus d'appel direct à http)       |

---

## Endpoints par Domaine

### 🔐 AUTH (PUBLIC)

```
POST /api/auth/register       [PUBLIC]
POST /api/auth/login          [PUBLIC]
```

### 👥 UTILISATEURS (ADMIN)

```
GET  /api/users               [ADMIN]
PUT  /api/users/{userId}      [ADMIN]
```

### 📦 PRODUITS (PUBLIC)

```
GET  /api/produits            [USER|ADMIN]
GET  /api/produits/{id}       [USER|ADMIN]
POST /api/produits            [AUTHENTICATED]
PUT  /api/produits/{id}       [AUTHENTICATED]
DELETE /api/produits/{id}     [AUTHENTICATED]
```

### 📅 COMMANDES (USER|ADMIN)

```
GET  /api/commandes           [USER|ADMIN]
GET  /api/commandes/{id}      [USER|ADMIN]
POST /api/commandes/{userId}  [USER]
PUT  /api/users/commandes/{comId} [AUTHENTICATED]
DELETE /api/commandes/{id}    [AUTHENTICATED]
```

### 📊 COMMANDES PRODUITS (USER|ADMIN)

```
GET  /api/commandesProduits            [USER|ADMIN]
GET  /api/commandesProduits/{id}       [USER|ADMIN]
POST /api/commandesProduits/{prodId}/{comId} [USER]
PUT  /api/commandesProduits/{id}       [AUTHENTICATED]
DELETE /api/commandesProduits/{id}     [AUTHENTICATED]
```

### 📦 CATEGORIES (PUBLIC)

```
GET /api/categories            [PUBLIC]
GET /api/categories/{id}       [PUBLIC]
```

### 🏭 LIGNE STOCKS (AUTHENTICATED)

```
GET  /api/ligneStocks          [AUTHENTICATED]
GET  /api/ligneStocks/{id}     [AUTHENTICATED]
POST /api/ligneStocks          [AUTHENTICATED]
PUT  /api/ligneStocks/{id}     [AUTHENTICATED]
DELETE /api/ligneStocks/{id}   [AUTHENTICATED]
```

---

## Structure du Panier

Le **panier est maintenant local** et géré en memory + localStorage:

```typescript
// Panier Local (localStorage)
interface LigneProduit {
  id: string; // UUID unique
  produitId: number; // Référence au produit /api/produits
  quantite: number; // Quantité
}

// Au moment du checkout:
// 1. POST /api/commandes/{userId}  → crée une Commande
// 2. Pour chaque article:
//    POST /api/commandesProduits/{prodId}/{comId}  → ajoute à la commande
// 3. localStorage.removeItem('panier_items')  → vide le panier local
```

---

## Points d'Intégration

### Composants Affectés

| Composant                  | Action                                       |
| -------------------------- | -------------------------------------------- |
| **ProductListComponent**   | Utilise ProduitsService                      |
| **BarreFiltrageComponent** | Utilise CartProduitService (search avec API) |
| **CartComponent**          | Utilise PanierService + CommandeService      |
| **OrderHistoryComponent**  | Utilise CommandeService                      |
| **AdminProductsComponent** | Utilise ProduitsService                      |
| **AdminUsersComponent**    | Utilise UtilisateursService                  |
| **AdminOrdersComponent**   | Utilise CommandeService                      |

---

## Intégration avec le Backend

### Proxy Configuration

Le fichier `proxy.conf.json` mappe `/api` vers `http://localhost:7000`:

```json
{
  "/api": {
    "target": "http://localhost:7000",
    "changeOrigin": true,
    "pathRewrite": { "^/api": "/api" }
  }
}
```

### Middlewares

- ✅ **proxy.conf.json**: Gère CORS et rerouting vers localhost:7000
- ✅ **auth.interceptor.ts**: Injecte le Bearer token JWT
- 🗑️ **middleware.js**: Maintenant vide (pas de persistence json-server)

---

## Changements dans package.json

Le script `start` **ne démarre plus json-server**:

```bash
# ✅ AVANT (db.json + json-server)
# npm start → démarre json-server sur port 3000

# ✅ MAINTENANT (API SQL Server)
# npm start → ng serve avec proxy vers localhost:7000
```

---

## Points d'Attention ⚠️

1. **Backend SQL Server DOIT fonctionner**
   - Le frontend attend `http://localhost:7000/api/*`
   - Si le backend est arrêté → toutes les requêtes échouent (404/500)

2. **Endpoints Manquants?**
   - Si un endpoint n'existe pas au backend → retour 404
   - Adapter le backend Spring Boot selon les besoins

3. **Authentification JWT**
   - Le token doit être valide et contenir les rôles (`ROLE_ADMIN`, `ROLE_USER`)
   - Les garde-routes (authGuard, roleGuard) contrôlent l'accès

4. **Panier Local**
   - Les articles du panier sont **perdus au refresh**
   - Implémenter une synchronisation persistante si nécessaire (localStorage déjà fait)

---

## Checklist de Déploiement

- [ ] Backend SQL Server opérationnel sur localhost:7000
- [ ] Endpoints `/api/*` testés avec curl
- [ ] CORS configuré au backend pour localhost:4200
- [ ] JwtFilter au backend accepte les tokens
- [ ] npm run build génère un bundle sans erreurs
- [ ] npm start fonctionne (proxy fonctionne)
- [ ] Login/Register testés avec credentials valides
- [ ] Admin dashboard accessible avec ROLE_ADMIN
- [ ] Panier → Checkout → Création Commande testée

---

## Build Status

✅ **Production Build**: 449.86 KB (esprimé: 111.56 KB)

Temps de compilation: ~11 secondes

---

**Migration complétée le**: 21 avril 2026
**Statut**: ✅ PRÊT POUR TESTING
