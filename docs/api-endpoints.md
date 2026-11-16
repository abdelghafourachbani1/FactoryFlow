# FactoryFlow API — endpoints et réponses

Base URL locale : `http://localhost:3000/api`. Les exemples ci-dessous montrent la forme des réponses produites par les contrôleurs. Remplacer `{id}` et `<JWT>` par les vraies valeurs.

## Authentification

Sauf indication contraire, les routes métier exigent cet en-tête :

```http
Authorization: Bearer <JWT>
```

Les rôles disponibles sont `ADMIN` et `OPERATOR`. Une réponse d’erreur suit généralement cette forme :

```json
{"success":false,"message":"Description de l’erreur"}
```

## Santé et documentation

| Méthode | Endpoint | Accès | Résultat en cas de succès |
|---|---|---|---|
| GET | `/api/health` | Public | `200` — `{"success":true,"database":"connected"}` (ou `"disconnected"`). |
| GET | `/api-docs` | Public | Page Swagger UI. |
| GET | `/api-docs.json` | Public | `200` — document OpenAPI 3.1 en JSON. |

## Installation

| Méthode | Endpoint | Accès | Résultat en cas de succès |
|---|---|---|---|
| GET | `/api/installation/status` | Public | `200` — `{"isInstalled":false}` ou `{"isInstalled":true}`. |
| POST | `/api/installation` | Public, une seule fois | `201` — `{"success":true,"message":"app installed succesfully","user":{"id":"<id>","name":"Admin","email":"admin@example.com","role":"ADMIN"}}`. Corps : `name`, `email`, `password` (8 caractères minimum). |

Une installation répétée renvoie `409`; des champs invalides renvoient `400`. Le mot de passe est haché avant stockage.

## Authentification et comptes

| Méthode | Endpoint | Accès | Résultat en cas de succès |
|---|---|---|---|
| POST | `/api/auth/login` | Public | `200` — `{"success":true,"message":"Login successful","token":"<JWT>","user":{"id":"<id>","name":"Nom","email":"user@example.com","role":"ADMIN"}}`. Corps : `email`, `password`. |
| GET | `/api/auth/profile` | Utilisateur connecté | `200` — `{"success":true,"data":{"_id":"<id>","name":"Nom","email":"user@example.com","role":"OPERATOR"}}`. Le mot de passe n’est jamais renvoyé. |
| POST | `/api/auth/users/operators` | Admin | `201` — `{"success":true,"data":{"_id":"<id>","name":"Opérateur","email":"op@example.com","role":"OPERATOR"}}`. Corps : `name`, `email`, `password`. |
| GET | `/api/auth/users/operators` | Admin | `200` — `{"success":true,"data":[{"_id":"<id>","name":"Opérateur","email":"op@example.com","role":"OPERATOR"}]}`. |
| POST | `/api/auth/users/admins` | Admin | `201` — `{"success":true,"data":{"_id":"<id>","name":"Admin","email":"admin2@example.com","role":"ADMIN"}}`. Corps : `name`, `email`, `password`. |

## Matières premières et stocks

| Méthode | Endpoint | Accès | Résultat en cas de succès |
|---|---|---|---|
| POST | `/api/matierPr` | Admin | `201` — `{"success":true,"message":"metier created succesfully","data":{...matière}}`. Corps : `name`, `referance`, `unit`; `stockQuantity` et `alertThreshold` sont optionnels et valent `0` par défaut. Un stock initial positif crée aussi un mouvement `ENTRY`. |
| GET | `/api/matierPr` | Admin ou Opérateur | `200` — `{"success":true,"data":[...matières]}`. |
| GET | `/api/matierPr/{id}` | Admin ou Opérateur | `200` — `{"success":true,"data":{...matière}}`. |
| PUT | `/api/matierPr/{id}` | Admin | `200` — `{"success":true,"message":"Matière première mise à jour avec succès","data":{...matière}}`. Modifie le nom, la référence, l’unité et/ou le seuil. Le stock se modifie par l’endpoint d’entrée. |
| DELETE | `/api/matierPr/{id}` | Admin | `200` — `{"success":true,"message":"Matière première supprimée avec succès"}`. La suppression est refusée avec `409` si elle est référencée par une recette, un ordre ou un mouvement. |
| POST | `/api/matierPr/{id}/stock` | Admin | `200` — `{"success":true,"message":"stock augmented","data":{...matière mise à jour}}`. Corps : `{"quantity":25}` avec une quantité strictement positive. Une entrée `ENTRY` est enregistrée avec la mise à jour du stock. |
| GET | `/api/matierPr/alerts` | Admin ou Opérateur | `200` — `{"success":true,"data":[...matières dont le stock est inférieur ou égal au seuil]}`. |
| GET | `/api/matierPr/movements` | Admin | `200` — `{"success":true,"data":[...mouvements]}`. Filtres facultatifs : `rawMaterial=<id>`, `type=ENTRY\|EXIT`, `limit=1..500` (100 par défaut). Chaque entrée comprend la matière, le type, la quantité, l’utilisateur, l’ordre éventuel et la date. |

Les références matière sont uniques. `stockQuantity` et `alertThreshold` acceptent zéro; les quantités d’entrée doivent être positives.

## Produits

| Méthode | Endpoint | Accès | Résultat en cas de succès |
|---|---|---|---|
| POST | `/api/products` | Admin | `201` — `{"success":true,"message":"Produit créé avec succès","data":{...produit}}`. Corps : `name`, `reference`, `composition` (au moins une ligne avec `rawMaterial` et `quantityRequired` strictement positive); `price` est facultatif. Le stock fini est géré par la fin des ordres. |
| GET | `/api/products` | Admin ou Opérateur | `200` — `{"success":true,"count":1,"data":[...produits avec composition]}`. |
| GET | `/api/products/{id}` | Admin ou Opérateur | `200` — `{"success":true,"data":{...produit avec composition}}`. |
| PUT | `/api/products/{id}` | Admin | `200` — `{"success":true,"message":"Produit mis à jour avec succès","data":{...produit}}`. Peut modifier nom, référence, prix ou composition. `stockQuantity` n’est pas modifiable directement. |
| DELETE | `/api/products/{id}` | Admin | `200` — `{"success":true,"message":"Produit supprimé avec succès"}`. Refus `409` si des ordres référencent le produit. |

Les références produit sont uniques. Une matière ne peut apparaître qu’une fois dans une composition.

## Ordres de fabrication

Statuts : `PLANIFIED` (planifié), `IN_PROGRESS` (en cours), `COMPLETED` (terminé), `CANCELLED` (annulé).

| Méthode | Endpoint | Accès | Résultat en cas de succès |
|---|---|---|---|
| POST | `/api/orders` | Admin | `201` — `{"success":true,"message":"Ordre de fabrication créé avec succès","data":{...ordre}}`. Corps requis : `product`, `operator`, `quantityToProduce` strictement positive, `plannedDate`; `reference` est facultative. L’ordre conserve une copie de la composition à sa création. |
| GET | `/api/orders` | Admin : tous les ordres; Opérateur : ses ordres uniquement | `200` — `{"success":true,"total":1,"page":1,"totalPages":1,"data":[...ordres]}`. Filtres : `status`, `product`, `startDate`, `endDate`, `page` (défaut `1`), `limit` (défaut `10`, maximum `100`). Les dates filtrent `plannedDate`; une date de fin seule inclut toute cette journée. |
| GET | `/api/orders/mine` | Opérateur | `200` — `{"success":true,"data":[...ordres qui lui sont affectés]}`. Filtre facultatif : `status`. |
| GET | `/api/orders/history` | Opérateur | `200` — `{"success":true,"data":[...ordres terminés qui lui sont affectés]}`. |
| GET | `/api/orders/{id}` | Admin ou opérateur affecté | `200` — `{"success":true,"data":{...ordre et instantané de composition}}`. Un autre opérateur reçoit `403`; un ordre absent reçoit `404`. |
| PUT | `/api/orders/{id}` | Admin, ordre planifié seulement | `200` — `{"success":true,"message":"Ordre de fabrication mis à jour avec succès","data":{...ordre}}`. Champs modifiables : `reference`, `quantityToProduce`, `operator`, `plannedDate`. |
| PATCH | `/api/orders/{id}/cancel` | Admin, ordre planifié seulement | `200` — `{"success":true,"message":"Ordre de fabrication annulé avec succès","data":{...ordre au statut CANCELLED}}`. |
| POST | `/api/orders/{id}/start` | Admin ou opérateur affecté | `200` — `{"success":true,"message":"Ordre de fabrication démarré avec succès. Stocks déduits.","data":{...ordre au statut IN_PROGRESS}}`. Le stock insuffisant ou une transition interdite renvoie `409`; le refus d’accès opérateur renvoie `403`. |
| POST | `/api/orders/{id}/complete` | Admin ou opérateur affecté | `200` — `{"success":true,"message":"Ordre de fabrication terminé avec succès. Produits finis ajoutés au stock.","data":{...ordre au statut COMPLETED}}`. L’opération ajoute la quantité fabriquée au stock fini. |

Au démarrage, les besoins sont `quantité unitaire × quantité à produire`. Les déductions, les mouvements `EXIT` et le passage à `IN_PROGRESS` sont enregistrés ensemble ou annulés ensemble. Un ordre ne peut démarrer qu’une fois.

## Codes d’erreur fréquents

| Code | Sens |
|---|---|
| `400` | Corps ou paramètres invalides, quantité non positive, filtre ou pagination invalides. |
| `401` | Jeton absent/invalide ou identifiants de connexion incorrects. |
| `403` | Rôle insuffisant ou ordre affecté à un autre opérateur. |
| `404` | Ressource absente ou identifiant invalide. |
| `409` | Référence déjà utilisée, installation déjà effectuée, stock insuffisant, transition interdite ou suppression qui casserait des références. |
| `500` | Erreur serveur ou accès à la base de données. |
