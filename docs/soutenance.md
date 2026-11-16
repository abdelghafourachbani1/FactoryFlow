# Soutenance FactoryFlow — support prêt à présenter

Le déroulé suit le format du brief : présentation 5 min, démonstration 5 min, lecture technique 10 min, exercice ciblé 10 min. Les commandes sont à exécuter depuis la racine du projet.

## Présentation orale — 5 minutes

> FactoryFlow répond à un problème de suivi de production dans une entreprise industrielle de Safi. Les produits, les matières et les ordres étaient suivis séparément. Il était possible de démarrer un ordre avec des stocks insuffisants, et les consommations n’étaient pas toujours enregistrées. L’objectif est donc de centraliser ces données et de fiabiliser la disponibilité des stocks.
>
> J’ai organisé le travail sur deux semaines, du 5 au 16 octobre. J’ai commencé par les règles métier, le modèle de données et l’architecture, puis le socle Docker et l’installation. Les fonctionnalités d’authentification, matières, produits et ordres suivent leurs dépendances. Les tests, Swagger et la préparation de la démonstration terminent le parcours. Le Gantt et les entités UML sont dans `docs/planification-et-modele.md`; le backlog est livré au format import Jira dans `docs/jira-import.csv`.
>
> L’API est développée en Node.js avec Express. MongoDB est utilisé via Mongoose. Le code sépare routes, contrôleurs, services, repositories et modèles. Les contrôleurs traduisent les échanges HTTP, les services appliquent les règles métier et les repositories regroupent les opérations de base de données. JWT authentifie les utilisateurs, bcryptjs hache les mots de passe, et les rôles Admin et Opérateur sont contrôlés côté serveur.
>
> L’Admin installe l’application une seule fois, gère les comptes, les matières, les seuils, les entrées de stock, les produits, les recettes et les ordres. L’opérateur voit uniquement ses ordres, les démarre et les termine. Un ordre conserve un instantané de la recette du produit lors de sa création. Une modification ultérieure de la recette ne change donc pas la fabrication planifiée.
>
> Au démarrage, FactoryFlow calcule chaque besoin en multipliant la quantité unitaire par le nombre de produits à fabriquer. Le service vérifie l’ensemble des matières avant toute déduction. Si un composant manque, la transaction est annulée. Si le stock suffit, les déductions, les mouvements de sortie et le changement de statut sont validés ensemble. Un ordre déjà démarré ne peut pas déduire une seconde fois. La fin ajoute les produits fabriqués au stock fini dans une autre transaction.
>
> Le backend et MongoDB sont orchestrés avec Docker Compose. MongoDB est configuré en replica set pour les transactions et son volume conserve les données après redémarrage. Les tests unitaires vérifient le calcul des besoins, le stock insuffisant, le démarrage réussi, le démarrage répété et le refus d’une seconde installation. Swagger documente les routes et des exemples d’utilisation sont dans le README.

## Démonstration — 5 minutes

1. Préparer `.env` à partir de `.env.example`, avec un secret local, puis lancer `docker compose up --build`. Attendre que MongoDB soit saine et l’API écoute sur le port 3000.
2. Dans un second terminal, fournir les identifiants Admin de démonstration et lancer les données de démonstration :

   ```sh
   DEMO_ADMIN_EMAIL=admin@example.test \
   DEMO_ADMIN_PASSWORD='VotreMotDePasseLocal' \
   npm run demo
   ```

   Au premier passage le script crée le premier Admin. Si l’installation est déjà faite, les mêmes identifiants Admin sont utilisés. Chaque exécution crée un opérateur, une matière, un produit et un ordre uniques.

3. Lire le résumé affiché : 100 kg sont approvisionnés, l’ordre de 10 pièces consomme 20 kg, le stock matière passe à 80 kg, deux mouvements sont présents (entrée et sortie), et le stock fini passe à 10 pièces.
4. Ouvrir `http://localhost:3000/api-docs` pour montrer les routes et le schéma OpenAPI. Montrer aussi `GET /api/installation/status`, les ordres affectés, les alertes et les mouvements avec Swagger ou les exemples du README.
5. Pour prouver la persistance, arrêter puis relancer les conteneurs avec `docker compose down` puis `docker compose up`; relancer la vérification de l’installation et consulter les ordres. Le volume MongoDB n’est pas supprimé par `down`.

## Lecture du code et questions — 10 minutes

- **Couches :** partir de `routes/ordreFabrication.routes.js`, suivre le contrôleur, `services/ordreFabrication.service.js`, puis `repositories/ordreFabrication.repository.js` et `repositories/stock.repository.js`.
- **Permissions :** montrer `middlewares/auth.middleware.js`, `middlewares/role.middleware.js` et le filtrage par `operatorId` dans la liste et le détail d’un ordre.
- **Cohérence :** montrer la transaction MongoDB au démarrage, les contrôles de stock, l’écriture des mouvements et le changement conditionnel de statut.
- **Recette figée :** montrer `compositionSnapshot` dans `models/ordreFabrication.model.js` et sa création depuis le produit dans le service.
- **Installation :** montrer le marqueur persistant `Installation`, l’index unique, le hachage au hook `pre('save')` et la transaction de première installation.
- **Tests :** exécuter `npm test` et expliquer les dépendances simulées pour tester le service sans MongoDB.
- **Docker :** expliquer le bind mount du code, le volume `mongodb_data` et le replica set `rs0` qui autorise les transactions.

Questions à réviser : pourquoi valider tous les stocks avant de les déduire ? Que se passe-t-il si l’écriture d’un mouvement échoue ? Pourquoi une vérification JWT ne suffit-elle pas à garantir qu’un ordre appartient à l’opérateur ? Quel est le rôle du snapshot de recette ? Pourquoi les transactions MongoDB nécessitent-elles un replica set ?

## Mise en situation ciblée — 10 minutes

Exercice d’entraînement proposé : ajouter `GET /api/matierPr/:id/movements` réservé à un utilisateur connecté, qui valide l’identifiant, vérifie l’existence de la matière, puis retourne ses mouvements triés du plus récent au plus ancien.

1. Ajouter une méthode de repository filtrant `StockMovement` par `rawMaterial` et faisant les `populate` utiles.
2. Ajouter une fonction de service qui valide l’identifiant et la matière, puis appelle le repository.
3. Ajouter un contrôleur qui renvoie `200` ou une erreur structurée `404`/`400`.
4. Ajouter la route après `GET /movements` et avant `GET /:id`, pour éviter qu’un chemin statique soit interprété comme un identifiant.
5. Documenter l’endpoint dans Swagger et écrire un test de service avec repository simulé.
6. Vérifier par `node --check`, `npm test` et l’appel HTTP authentifié.

## Suivi Jira

`docs/jira-import.csv` contient un backlog d’import avec les tâches, leur description, priorité, estimation et dépendances. Après import dans Jira, associer chaque tâche au projet de l’apprenant et reporter les vraies dates d’avancement. Ne pas déclarer comme historique Jira des changements reconstitués après coup.
