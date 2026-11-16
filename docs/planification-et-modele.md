# Planification et conception FactoryFlow

## Gantt (période du brief : 5 au 16 octobre 2026)

```mermaid
gantt
    title FactoryFlow — plan de deux semaines
    dateFormat YYYY-MM-DD
    axisFormat %d/%m
    excludes weekends
    section Cadrage
    Besoin, règles et backlog Jira       :a1, 2026-10-05, 1d
    Modèle UML et architecture           :a2, after a1, 1d
    section Socle API
    Docker, MongoDB et installation      :b1, after a2, 1d
    JWT, profils et permissions          :b2, after b1, 1d
    section Référentiels et production
    Matières, produits et compositions   :c1, after b2, 2d
    Ordres et transitions transactionnelles :c3, after c1, 2d
    Filtres, alertes et pagination       :c4, after c3, 1d
    section Livraison
    Tests, Swagger, corrections et démonstration :d1, after c4, 1d
```

Les dépendances sont séquentielles sur le chemin principal : les ordres dépendent des utilisateurs, matières et produits ; les tests et la démonstration viennent après les parcours métier. Le suivi Jira reste à reporter dans l’espace Jira de l’apprenant.

## UML — modèle de domaine

```mermaid
classDiagram
    class User {
      +ObjectId _id
      +String name
      +String email
      +String passwordHash
      +Role role
    }
    class MatierPr {
      +ObjectId _id
      +String referance
      +String unit
      +Number stockQuantity
      +Number alertThreshold
    }
    class Product {
      +ObjectId _id
      +String reference
      +String name
      +Composition[] composition
      +Number stockQuantity
    }
    class OrdreFabrication {
      +ObjectId _id
      +String reference
      +Number quantityToProduce
      +Status status
      +Date plannedDate
      +Date startDate
      +Date endDate
      +CompositionSnapshot[] compositionSnapshot
    }
    class StockMovement {
      +ObjectId _id
      +MovementType type
      +Number quantity
      +Date createdAt
    }
    class Installation {
      +String key
    }
    Product "1" --> "1..*" MatierPr : composition
    OrdreFabrication "*" --> "1" Product : produit
    OrdreFabrication "*" --> "1" User : opérateur affecté
    OrdreFabrication "1" --> "1..*" MatierPr : instantané de recette
    StockMovement "*" --> "1" MatierPr : matière
    StockMovement "*" --> "1" User : auteur
    StockMovement "0..*" --> "0..1" OrdreFabrication : ordre associé
```
