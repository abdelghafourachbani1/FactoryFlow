# FactoryFlow API

API Node.js/Express et MongoDB pour la gestion des matières premières, des recettes et des ordres de fabrication. Toute l’API est préfixée par `/api`. Il n’y a pas d’interface web.

## Démarrage avec Docker

1. Copier `.env.example` vers `.env` et remplacer `JWT_SECRET` par une valeur aléatoire privée (32 caractères ou plus).
2. Lancer `docker compose up --build`.
3. Ouvrir Swagger sur <http://localhost:3000/api-docs>.

Le code est monté dans le conteneur : `node --watch` recharge l’API lors des modifications locales. MongoDB fonctionne en replica set pour les transactions et ses données persistent dans le volume `mongodb_data`. Arrêt : `docker compose down` (les données restent). `docker compose down -v` supprime le volume et les données.

En local, installer les dépendances avec `npm ci`, configurer les variables dans `.env`, démarrer un MongoDB replica set et lancer `npm run dev`. Pour lancer les tests unitaires : `npm test`.

## Installation et connexion

```sh
curl http://localhost:3000/api/installation/status
curl -X POST http://localhost:3000/api/installation -H 'Content-Type: application/json' \
  -d '{"name":"Admin Safi","email":"admin@example.com","password":"mot-de-passe-long"}'
curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"mot-de-passe-long"}'
```

Envoyer ensuite `Authorization: Bearer <token>` sur les routes protégées. Le profil courant est `GET /api/auth/profile`. L’Admin peut créer des opérateurs via `POST /api/auth/users/operators` et consulter les opérateurs via `GET /api/auth/users/operators`.

## Parcours de démonstration

Avec le token Admin, créer une matière (`POST /api/matierPr`) :

```json
{"name":"Acier","referance":"ACIER-01","unit":"kg","stockQuantity":0,"alertThreshold":5}
```

Ajouter un approvisionnement via `POST /api/matierPr/{id}/stock` avec `{"quantity":100}`. Créer ensuite un produit (`POST /api/products`) dont la composition référence l’identifiant de la matière :

```json
{"name":"Pièce A","reference":"PIECE-A","price":0,"composition":[{"rawMaterial":"<id-matiere>","quantityRequired":2}]}
```

Créer un ordre (`POST /api/orders`) avec les identifiants produit et opérateur, une référence, une quantité et une date ISO `plannedDate`. L’opérateur se connecte, consulte `GET /api/orders/mine`, puis appelle `POST /api/orders/{id}/start` et `POST /api/orders/{id}/complete`. Le démarrage contrôle toutes les matières avant déduction, inscrit les mouvements de sortie dans la même transaction que le stock et le statut. La fin ajoute les produits finis au stock.

## Routes principales

- Installation : `GET /api/installation/status`, `POST /api/installation` (une seule fois).
- Auth : `POST /api/auth/login`, `GET /api/auth/profile`, routes Admin `/api/auth/users/operators`.
- Matières (Admin pour les écritures) : CRUD `/api/matierPr`, `POST /:id/stock`, `GET /alerts`, `GET /movements`.
- Produits (Admin pour les écritures) : CRUD `/api/products`.
- Ordres : création, filtres et pagination `/api/orders` (Admin); les opérateurs ne voient que leurs ordres. `GET /mine`, `GET /history`, démarrage et fin sont réservés à l’opérateur affecté ou à l’Admin. Seul l’Admin modifie ou annule un ordre planifié.

Les ordres figent leur composition à la création. Les statuts stockés sont `PLANIFIED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. Les filtres de liste acceptent `status`, `product`, `startDate`, `endDate`, `page`, `limit` (maximum 100). Le schéma OpenAPI est disponible sur Swagger UI à `/api-docs` et en JSON sur `/api-docs.json`.

La liste détaillée des endpoints, des rôles, des corps de requête et des réponses est dans [docs/api-endpoints.md](docs/api-endpoints.md).

Le calendrier cible et le diagramme UML sont fournis dans [docs/planification-et-modele.md](docs/planification-et-modele.md).
Le backlog prêt à importer dans Jira et le déroulé de soutenance sont fournis dans [docs/jira-import.csv](docs/jira-import.csv) et [docs/soutenance.md](docs/soutenance.md).

Pour rejouer automatiquement la démonstration complète après `docker compose up --build`, lancer `DEMO_ADMIN_EMAIL=... DEMO_ADMIN_PASSWORD='...' npm run demo`. Le script installe le premier Admin seulement si l’application est vierge, puis crée des données uniques et exécute le parcours matière → ordre → consommation → produit fini. Il vérifie aussi le refus du stock insuffisant, le cloisonnement opérateur, la recette figée et le second démarrage.

Après un redémarrage des conteneurs, vérifier l’installation et un ordre existant avec `DEMO_ADMIN_EMAIL=... DEMO_ADMIN_PASSWORD='...' PERSISTENCE_ORDER_REFERENCE=DEMO-OF-... npm run verify:persistence`.

Le fichier Jira est un backlog d’import, pas une preuve d’activité dans un espace Jira. Après import, reporter les véritables dates et états dans le projet Jira utilisé pour la soutenance.
