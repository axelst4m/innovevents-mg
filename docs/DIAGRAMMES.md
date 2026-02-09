# Diagrammes UML

Ce document contient les principaux diagrammes du projet. Ils sont écrits en syntaxe Mermaid donc ils devraient s'afficher correctement sur GitHub/GitLab.

## Diagramme de cas d'utilisation

```mermaid
graph TB
    subgraph Visiteur
        V1[Consulter les événements publics]
        V2[Faire une demande de devis]
        V3[Envoyer un message contact]
        V4[S'inscrire]
        V5[Se connecter]
    end

    subgraph Client
        C1[Voir mes devis]
        C2[Accepter un devis]
        C3[Refuser un devis]
        C4[Demander une modification]
        C5[Laisser un avis]
        C6[Modifier mon profil]
    end

    subgraph Admin/Employé
        A1[Gérer les prospects]
        A2[Convertir prospect en client]
        A3[Créer un devis]
        A4[Envoyer un devis]
        A5[Gérer les événements]
        A6[Voir le dashboard]
        A7[Gérer les utilisateurs]
        A8[Valider les avis]
    end

    V4 --> Client
    V5 --> Client
    V5 --> Admin/Employé
```

## Diagramme de séquence - Demande de devis

Ce diagramme montre ce qui se passe quand quelqu'un fait une demande de devis depuis le site.

```mermaid
sequenceDiagram
    participant V as Visiteur
    participant F as Frontend
    participant A as API
    participant PG as PostgreSQL
    participant MG as MongoDB

    V->>F: Remplit le formulaire de demande
    F->>F: Validation côté client
    F->>A: POST /api/prospects
    A->>A: Validation des données
    A->>PG: INSERT INTO prospects
    PG-->>A: OK + id
    A->>MG: Log QUOTE_REQUEST_CREATED
    MG-->>A: OK
    A-->>F: 201 Created + message
    F-->>V: Affiche confirmation
```

## Diagramme de séquence - Conversion prospect → client

```mermaid
sequenceDiagram
    participant AD as Admin
    participant F as Frontend
    participant A as API
    participant PG as PostgreSQL
    participant MG as MongoDB

    AD->>F: Clic sur "Convertir en client"
    F->>A: POST /api/prospects/:id/convert
    A->>PG: SELECT prospect
    PG-->>A: Données du prospect
    A->>PG: INSERT INTO clients
    PG-->>A: OK + client_id
    A->>PG: INSERT INTO devis (brouillon)
    PG-->>A: OK + devis_id
    A->>PG: UPDATE prospect SET client_id, status='qualifie'
    PG-->>A: OK
    A->>MG: Log CREATION_CLIENT
    MG-->>A: OK
    A-->>F: 201 + client + devis
    F-->>AD: Redirige vers le devis
```

## Diagramme de séquence - Authentification

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant A as API
    participant PG as PostgreSQL
    participant MG as MongoDB

    U->>F: Saisit email + mot de passe
    F->>A: POST /api/auth/login
    A->>PG: SELECT user WHERE email
    PG-->>A: User + password_hash

    alt Mot de passe correct
        A->>A: bcrypt.compare OK
        A->>A: Génère JWT
        A->>MG: Log CONNEXION_REUSSIE
        A-->>F: 200 + token + user
        F->>F: Stocke token (localStorage)
        F-->>U: Redirige vers dashboard
    else Mot de passe incorrect
        A->>MG: Log CONNEXION_ECHOUEE
        A-->>F: 401 Unauthorized
        F-->>U: Affiche erreur
    end
```

## Diagramme de séquence - Workflow complet d'un devis

```mermaid
sequenceDiagram
    participant C as Client
    participant AD as Admin
    participant F as Frontend
    participant A as API
    participant PG as PostgreSQL

    Note over AD: Le devis existe déjà (brouillon)

    AD->>F: Ajoute des lignes au devis
    F->>A: POST /api/devis/:id/lignes
    A->>PG: INSERT INTO lignes_devis
    A->>PG: UPDATE devis totaux
    A-->>F: OK

    AD->>F: Envoie le devis
    F->>A: PATCH /api/devis/:id/send
    A->>PG: UPDATE devis SET status='envoye'
    A-->>F: OK + PDF généré

    Note over C: Le client reçoit le devis

    C->>F: Consulte le devis
    F->>A: GET /api/devis/:id
    A->>PG: SELECT devis + lignes
    A-->>F: Données complètes

    alt Client accepte
        C->>F: Clic "Accepter"
        F->>A: PATCH /api/devis/:id/accept
        A->>PG: UPDATE status='accepte'
        A-->>F: OK
    else Client refuse
        C->>F: Clic "Refuser"
        F->>A: PATCH /api/devis/:id/refuse
        A->>PG: UPDATE status='refuse'
        A-->>F: OK
    else Client demande modif
        C->>F: Clic "Demander modification"
        F->>A: PATCH /api/devis/:id/request-modification
        A->>PG: UPDATE status='modification'
        A-->>F: OK
        Note over AD: L'admin reçoit la demande
    end
```

## Diagramme d'états - Cycle de vie d'un devis

```mermaid
stateDiagram-v2
    [*] --> Brouillon: Création
    Brouillon --> Envoyé: Admin envoie
    Envoyé --> EnEtude: Client consulte
    EnEtude --> Accepté: Client accepte
    EnEtude --> Refusé: Client refuse
    EnEtude --> Modification: Client demande modif
    Modification --> Brouillon: Admin modifie
    Accepté --> [*]
    Refusé --> [*]
```

## Diagramme d'états - Cycle de vie d'un prospect

```mermaid
stateDiagram-v2
    [*] --> AContacter: Nouvelle demande
    AContacter --> Contacté: Admin appelle
    Contacté --> Qualifié: Conversion en client
    Contacté --> Refusé: Pas intéressé
    AContacter --> Refusé: Spam/Invalide
    Qualifié --> [*]
    Refusé --> [*]
```

## Diagramme de classes simplifié

```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string password_hash
        +string firstname
        +string lastname
        +string role
        +bool is_active
        +login()
        +changePassword()
    }

    class Client {
        +int id
        +string company_name
        +string email
        +int user_id
        +getDevis()
        +getEvents()
    }

    class Prospect {
        +int id
        +string company_name
        +string email
        +string status
        +int client_id
        +convert()
    }

    class Event {
        +int id
        +string name
        +string event_type
        +datetime start_date
        +string status
        +int client_id
        +getPrestations()
        +getTasks()
    }

    class Devis {
        +int id
        +string reference
        +string status
        +decimal total_ttc
        +int client_id
        +getLignes()
        +generatePDF()
        +send()
    }

    class LigneDevis {
        +int id
        +string label
        +int quantity
        +decimal unit_price_ht
        +decimal total_ttc
    }

    User "1" -- "0..1" Client : a un compte
    Client "1" -- "*" Devis : reçoit
    Client "1" -- "*" Event : participe à
    Prospect "1" -- "0..1" Client : devient
    Devis "1" -- "*" LigneDevis : contient
    Event "1" -- "0..1" Devis : lié à
```

## Architecture technique

```mermaid
graph TB
    subgraph Frontend
        R[React App]
        RC[AuthContext]
        RR[React Router]
    end

    subgraph Backend
        E[Express Server]
        MW[Middlewares]
        RT[Routes]
        UT[Utils]
    end

    subgraph Databases
        PG[(PostgreSQL)]
        MG[(MongoDB)]
    end

    R --> E
    E --> MW
    MW --> RT
    RT --> PG
    RT --> MG
    UT --> PG

    style PG fill:#336791
    style MG fill:#4DB33D
    style R fill:#61DAFB
    style E fill:#68A063
```
