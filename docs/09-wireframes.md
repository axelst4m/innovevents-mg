# Wireframes

Maquettes simplifiees des principales pages de l'application. On a utilise des schemas ASCII pendant la conception, avant de coder. Ce document a ete mis a jour pour refleter l'etat final de l'application.

## Navigation globale (AppLayout)

L'application utilise un header avec menu deroulant (pas de sidebar). Le footer contient les liens legaux.

```
┌──────────────────────────────────────────────────────────────┐
│  INNOV'EVENTS  [Accueil] [Evenements] [Avis] [Contact]      │
│                                   [Demande de devis]  [Menu▼]│
└──────────────────────────────────────────────────────────────┘

Menu deroulant (selon role) :
- Admin : Dashboard Admin, Prospects, Gestion Evenements,
          Gestion Devis, Messages Contact, Moderation Avis,
          Gestion Utilisateurs, Mon profil, Deconnexion
- Employe : Moderation Avis, Mon profil, Deconnexion
- Client : Mon espace, Mes devis, Mon profil, Deconnexion
- Non connecte : Se connecter

Footer :
┌──────────────────────────────────────────────────────────────┐
│  (c) 2026 Innov'Events     [Mentions legales] [CGU] [CGV]   │
└──────────────────────────────────────────────────────────────┘
```

---

## Page d'accueil (Home)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                      INNOV'EVENTS                            │
│          Agence evenementielle sur mesure                     │
│                                                              │
│                  [Demander un devis]                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                  Qui sommes nous ?                            │
│                                                              │
│  Presentation de l'agence, histoire et philosophie           │
│  (2 paragraphes dans une carte)                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                    Nos services                              │
│                                                              │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│    │Seminaire│    │Conferen.│    │ Soirees │               │
│    │  desc.  │    │  desc.  │    │  desc.  │               │
│    └─────────┘    └─────────┘    └─────────┘               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                 En quelques chiffres                          │
│                                                              │
│    ┌────┐    ┌────┐    ┌────┐    ┌────┐                     │
│    │ 5  │    │ 50+│    │  8 │    │100%│                     │
│    │ans │    │evts│    │team│    │sur │                     │
│    │exp.│    │    │    │    │    │mes.│                     │
│    └────┘    └────┘    └────┘    └────┘                     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                   Un projet en tete ?                         │
│                                                              │
│        [Demander un devis]  [Nous contacter]                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Footer]                                                    │
└──────────────────────────────────────────────────────────────┘
```

## Page Evenements (publique)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                   Nos Evenements                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Filtrer : [▼ Type]  [Theme ___]  [Date debut] [Date fin]│ │
│  │                                        [Reinitialiser] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│    │   [image]    │  │   [image]    │  │   [image]    │    │
│    │  [Type]      │  │  [Type]      │  │  [Type]      │    │
│    │  Titre       │  │  Titre       │  │  Titre       │    │
│    │  Theme       │  │  Theme       │  │  Theme       │    │
│    │  Date, Lieu  │  │  Date, Lieu  │  │  Date, Lieu  │    │
│    │  [Details]   │  │  [Details]   │  │  [Details]   │    │
│    └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│              Un projet ? [Demander un devis]                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Page Avis (publique)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────┐  ┌──────────────────────┐ │
│  │ Avis de nos clients          │  │ Statistiques          │ │
│  │ [Donner mon avis]            │  │                      │ │
│  │                              │  │    4.6 / 5           │ │
│  │ ┌──────────────────────────┐ │  │    ★★★★★             │ │
│  │ │ Formulaire (si ouvert)   │ │  │    12 avis           │ │
│  │ │ Nom, Entreprise, Note,  │ │  │                      │ │
│  │ │ Titre, Commentaire      │ │  │ 5★ ████████████ 8   │ │
│  │ │ [Envoyer] [Annuler]     │ │  │ 4★ ██████      3   │ │
│  │ └──────────────────────────┘ │  │ 3★ ██          1   │ │
│  │                              │  │ 2★              0   │ │
│  │ ┌──────────────────────────┐ │  │ 1★              0   │ │
│  │ │ [★ Mis en avant]        │ │  │                      │ │
│  │ │ Titre de l'avis         │ │  └──────────────────────┘ │
│  │ │ ★★★★★      12/02/2026  │ │                           │
│  │ │ Contenu de l'avis...    │ │                           │
│  │ │ Par Jean D. - Corp Inc  │ │                           │
│  │ │ [Evenement associe]     │ │                           │
│  │ └──────────────────────────┘ │                           │
│  │ (liste des avis...)         │                           │
│  └──────────────────────────────┘                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Page Contact

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    Nous contacter                            │
│                                                              │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│    │ Adresse  │  │Telephone │  │  Email   │               │
│    └──────────┘  └──────────┘  └──────────┘               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Envoyer un message                                     │ │
│  │                                                        │ │
│  │ Prenom [__________]  Nom [__________]                  │ │
│  │ Email  [__________]  Tel [__________]                  │ │
│  │ Sujet  [▼ Information / Devis / Evenement / ...]       │ │
│  │ Message                                                │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │                                                    │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │                   [Envoyer le message]                  │ │
│  │                                                        │ │
│  │ * En soumettant, vous acceptez notre politique RGPD    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Formulaire de demande de devis (QuoteRequest)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  Demande de devis                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Vos coordonnees                                        │ │
│  │                                                        │ │
│  │ Entreprise     [________________________]              │ │
│  │ Prenom         [____________] Nom [____________]       │ │
│  │ Email          [________________________]              │ │
│  │ Telephone      [________________________]              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Votre evenement                                        │ │
│  │                                                        │ │
│  │ Type           [▼ Seminaire / Conference / ...]        │ │
│  │ Date           [__/__/____]                            │ │
│  │ Lieu           [________________________]              │ │
│  │ Participants   [____]                                  │ │
│  │                                                        │ │
│  │ Message        ┌────────────────────────────────────┐  │ │
│  │                │                                    │  │ │
│  │                └────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                      [Envoyer ma demande]                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Connexion (Login)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│         ┌────────────────────────────────────┐              │
│         │         Connexion                  │              │
│         │                                    │              │
│         │ Email    [____________________]    │              │
│         │ Mot de passe [________________]    │              │
│         │              Mot de passe oublie ? │              │
│         │                                    │              │
│         │        [Se connecter]              │              │
│         │                                    │              │
│         │  Pas encore de compte ? S'inscrire │              │
│         └────────────────────────────────────┘              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Formulaire "Mot de passe oublie" :
- Remplace le formulaire de connexion
- Champ email + bouton d'envoi
- Lien retour vers connexion
```

## Inscription (Register)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│         ┌────────────────────────────────────┐              │
│         │         Inscription                │              │
│         │                                    │              │
│         │ Prenom   [____________________]    │              │
│         │ Nom      [____________________]    │              │
│         │ Email    [____________________]    │              │
│         │ Mot de passe [________________]    │              │
│         │ Confirmer    [________________]    │              │
│         │                                    │              │
│         │ * 8 car. min, majuscule,           │              │
│         │   minuscule, chiffre, special      │              │
│         │                                    │              │
│         │        [S'inscrire]                │              │
│         │                                    │              │
│         │  Deja un compte ? Se connecter     │              │
│         └────────────────────────────────────┘              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Dashboard Admin

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Dashboard Admin                            [Actualiser]     │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  │ Prospects  │ │  Clients   │ │   Devis    │ │ Chiffre    ││
│  │   12       │ │    8       │ │    15      │ │ d'affaires ││
│  │ 3 a contact│ │ 2 ce mois │ │ 5 attente  │ │ 45 000 EUR ││
│  │ 4 qualifies│ │            │ │ 8 acceptes │ │ 12k en att.││
│  │ 2 semaine  │ │            │ │ 2 brouillon│ │            ││
│  │ [Voir]     │ │            │ │ [Gerer]    │ │            ││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘│
│                                                              │
│  Evenements                                    [Gerer]       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                               │
│  │ 10 │ │  3 │ │  5 │ │  2 │                               │
│  │Tot.│ │Cours│ │Term│ │Venir│                               │
│  └────┘ └────┘ └────┘ └────┘                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Derniers    │  │  Derniers    │  │  Notes       │      │
│  │  prospects   │  │  devis       │  │  recentes    │      │
│  │              │  │              │  │              │      │
│  │  Corp Inc    │  │  DEV-0005   │  │  Jose: note  │      │
│  │  Jean D.     │  │  Corp Inc   │  │  sur event   │      │
│  │  ● Contacte  │  │  3 480 EUR  │  │  12/02 14h   │      │
│  │  (...)       │  │  (...)       │  │  (...)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Prochains evenements                                │    │
│  │  Seminaire Tech - Paris - 15/02/2026                │    │
│  │  Gala annuel - Lyon - 20/02/2026                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Liste des prospects (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Admin - Prospects                                           │
│  Liste des demandes de devis                                 │
│                                                              │
│  Filtrer: [▼ Statut]  Limite: [50]  [Actualiser]            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ID│Entreprise│Contact│Email│Event│Date│Nb│Statut│Actions│ │
│  ├──┼──────────┼───────┼─────┼─────┼────┼──┼──────┼───────┤ │
│  │1 │Corp Inc  │Jean D.│j@.. │Semin│26/1│50│●Cont.│[Cont.]│ │
│  │  │          │       │     │     │    │  │      │[Qual.]│ │
│  │  │          │       │     │     │    │  │      │[Ref.] │ │
│  │  │          │       │     │     │    │  │      │[Voir] │ │
│  ├──┼──────────┼───────┼─────┼─────┼────┼──┼──────┼───────┤ │
│  │2 │Startup   │Paul M.│p@.. │Gala │25/1│80│●Qual.│[...]  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Modal detail prospect

```
┌────────────────────────────────────────────┐
│  Detail du prospect                  [X]   │
├────────────────────────────────────────────┤
│                                            │
│  Entreprise : Corp Inc                     │
│  Contact    : Jean Dupont                  │
│  Email      : jean@corpinc.fr              │
│  Telephone  : 06 12 34 56 78              │
│  Localisation : Paris                      │
│                                            │
│  ─────────────────────────────────         │
│                                            │
│  Type       : Seminaire                    │
│  Date       : 15/06/2026                   │
│  Participants : 50                         │
│  Statut     : ● A contacter               │
│                                            │
│  Message:                                  │
│  ┌────────────────────────────────────┐    │
│  │ "Nous souhaitons organiser un     │    │
│  │  seminaire pour nos equipes..."   │    │
│  └────────────────────────────────────┘    │
│                                            │
├────────────────────────────────────────────┤
│ [Completer le devis] [Creer devis]         │
│ [Convertir en client]          [Fermer]    │
└────────────────────────────────────────────┘
```

## Gestion des devis (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Gestion des Devis                       [+ Nouveau devis]   │
│                                                              │
│  Filtrer: [▼ Statut] [▼ Client]  [Reinitialiser]           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │Reference │Client  │Evenement│Total TTC│Statut│Date│Act.│ │
│  ├──────────┼────────┼─────────┼─────────┼──────┼────┼────┤ │
│  │DEV-0005  │Corp Inc│Seminaire│3 480 EUR│●Brouil│26/1│[V] │ │
│  │          │Jean D. │         │         │      │    │[P] │ │
│  │          │        │         │         │      │    │[E] │ │
│  ├──────────┼────────┼─────────┼─────────┼──────┼────┼────┤ │
│  │DEV-0002  │Start.  │Gala    │5 200 EUR│●Acc. │15/1│[V] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [V]=Voir [P]=PDF [E]=Envoyer (si brouillon)               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Modal creation devis

```
┌──────────────────────────────────────────────────────────────┐
│  Nouveau devis                                         [X]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Client*         [▼ Selectionner un client]                  │
│  Evenement lie   [▼ Selectionner (optionnel)]               │
│  Valide jusqu'au [__/__/____]                               │
│  Message         [________________________]                  │
│                                                              │
│  Prestations :                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Description         │ Qte │ Prix HT │ TVA % │  [X]    │ │
│  ├─────────────────────┼─────┼─────────┼───────┼─────────┤ │
│  │ Location salle      │  1  │ 800 EUR │ 20%   │  [Suppr]│ │
│  │ Traiteur            │  1  │ 1500 EUR│ 20%   │  [Suppr]│ │
│  ├─────────────────────┴─────┴─────────┴───────┴─────────┤ │
│  │                            Total TTC estime : 2 760 EUR│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Ajouter : [Description] [Qte] [PU HT] [TVA%] [+ Ajouter] │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Annuler]                              [Creer le devis]     │
└──────────────────────────────────────────────────────────────┘
```

## Modal detail devis (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  Devis DEV-2026-0005                                   [X]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Client : Corp Inc - Jean Dupont                             │
│  Email : jean@corpinc.fr | Tel : 06 12 34 56 78            │
│  Reference : DEV-2026-0005  │ Statut : ● Brouillon          │
│  Cree le : 26/01/2026       │ Valide jusqu'au : 25/02/2026  │
│                                                              │
│  Evenement lie : Seminaire Tech (si associe)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Description         │ Qte │ PU HT  │ TVA% │ Total TTC│ │
│  ├─────────────────────┼─────┼────────┼──────┼──────────┤ │
│  │ Location salle      │  1  │ 800 EUR│ 20%  │ 960 EUR  │ │
│  │ Traiteur            │  1  │ 1500EUR│ 20%  │ 1800 EUR │ │
│  │ Animation DJ        │  1  │ 600 EUR│ 20%  │ 720 EUR  │ │
│  ├─────────────────────┴─────┴────────┼──────┴──────────┤ │
│  │                        Total HT    │      2 900 EUR  │ │
│  │                        Total TVA   │        580 EUR  │ │
│  │                        Total TTC   │      3 480 EUR  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Message : "Suite a notre echange telephonique..."           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Telecharger PDF]  [Envoyer au client]            [Fermer] │
└──────────────────────────────────────────────────────────────┘
```

## Espace client - Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Bonjour Jean !                                              │
│  Bienvenue dans votre espace client Innov'Events.            │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │    3     │  │    1     │  │    2     │                  │
│  │  Total   │  │En attente│  │ Acceptes │                  │
│  │  devis   │  │          │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
│  ┌────────────────────────────────────┐  ┌────────────────┐ │
│  │ Derniers devis        [Voir tout] │  │ Mon compte      │ │
│  │                                    │  │                │ │
│  │ Ref.  │ Event │ TTC    │ Statut   │  │ Jean Dupont    │ │
│  │ 0005  │ Semin.│ 3480EUR│ ●Attente │  │ jean@test.fr   │ │
│  │ 0002  │ Gala  │ 5200EUR│ ●Accepte │  │ Inscrit le ... │ │
│  │                                    │  │ [Changer MDP]  │ │
│  ├────────────────────────────────────┤  ├────────────────┤ │
│  │ Prochain evenement                 │  │Actions rapides │ │
│  │ Seminaire Tech - 15/02 - Paris    │  │[Demander devis]│ │
│  │                                    │  │[Voir mes devis]│ │
│  └────────────────────────────────────┘  │[Nous contacter]│ │
│                                          └────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Espace client - Mes devis

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                       Mes Devis                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ DEV-0005     │  │ DEV-0002     │  │ DEV-0001     │      │
│  │ ● En attente │  │ ● Accepte    │  │ ● Refuse     │      │
│  │              │  │              │  │              │      │
│  │ Seminaire    │  │ Gala annuel  │  │ Conference   │      │
│  │ 26/01/2026   │  │ 15/01/2026   │  │ 10/01/2026   │      │
│  │ Valide: 25/02│  │              │  │              │      │
│  │              │  │              │  │              │      │
│  │ 3 480 EUR    │  │ 5 200 EUR    │  │ 1 800 EUR    │      │
│  │              │  │              │  │              │      │
│  │ [Voir detail]│  │ [Voir detail]│  │ [Voir detail]│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Modal detail devis (Client)

```
┌──────────────────────────────────────────────────────────────┐
│  Devis DEV-2026-0005                                   [X]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ● En attente                           Cree le 26/01/2026  │
│                                                              │
│  Evenement : Seminaire Tech Solutions                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Description                    │ Qte │ Prix HT│Tot TTC│ │
│  ├────────────────────────────────┼─────┼────────┼───────┤ │
│  │ Location salle seminaire       │  1  │ 800 EUR│960 EUR│ │
│  │ Traiteur - Formule business    │ 50  │  30 EUR│1800EUR│ │
│  │ Animation DJ                   │  1  │ 600 EUR│720 EUR│ │
│  ├────────────────────────────────┴─────┼────────┼───────┤ │
│  │                          Total HT    │        │2900EUR│ │
│  │                          TVA         │        │ 580EUR│ │
│  │                          Total TTC   │        │3480EUR│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Valide jusqu'au 25/02/2026                                  │
│  Message : "Suite a notre echange..."                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [Accepter]  [Demander modification]  [Refuser]        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Telecharger en PDF]                             [Fermer]   │
└──────────────────────────────────────────────────────────────┘
```

## Gestion des evenements (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Gestion des Evenements                [+ Nouvel evenement]  │
│                                                              │
│  Filtrer: [▼ Statut]  [Reinitialiser]                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Nom      │Type   │Client │Date   │Lieu  │Stat.│Pub│Act│ │
│  ├──────────┼───────┼───────┼───────┼──────┼─────┼───┼───┤ │
│  │ Seminaire│Semin. │Corp   │15/02  │Paris │●Cours│Oui│[D]│ │
│  │ Tech     │       │Inc    │       │      │     │   │[M]│ │
│  │          │       │       │       │      │     │   │[S]│ │
│  ├──────────┼───────┼───────┼───────┼──────┼─────┼───┼───┤ │
│  │ Gala     │Soiree │Start. │20/02  │Lyon  │●Venir│Non│...│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [D]=Details [M]=Modifier [S]=Supprimer                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Gestion des utilisateurs (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Gestion des utilisateurs            [+ Nouvel utilisateur]  │
│                                                              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                │
│  │  8 │ │  2 │ │  2 │ │  4 │ │  7 │ │  1 │                │
│  │Tot.│ │Adm.│ │Empl│ │Cli.│ │Act.│ │Inac│                │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                │
│                                                              │
│  Filtres: [▼ Role] [▼ Statut]  [Actualiser]                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ID│ Nom         │ Email       │ Role  │ Statut│Cree│Act│ │
│  ├───┼─────────────┼─────────────┼───────┼───────┼────┼───┤ │
│  │ 1 │ Chloe Durand│ chloe@ino.fr│ Admin │●Actif │01/1│[M]│ │
│  │   │             │             │       │       │    │[R]│ │
│  │   │             │             │       │       │    │[D]│ │
│  ├───┼─────────────┼─────────────┼───────┼───────┼────┼───┤ │
│  │ 4 │ Yvan Martin │ yvan@tech.fr│ Client│●Actif │05/1│...│ │
│  ├───┼─────────────┼─────────────┼───────┼───────┼────┼───┤ │
│  │ 7 │ Marie L.    │ marie@ex.fr │ Client│○Inact.│10/1│...│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [M]=Modifier [R]=Reset MDP [D]=Desactiver/Reactiver       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Messages de contact (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Messages de contact  [2]   ☐ Afficher archives  [Actualiser]│
│                                                              │
│  ┌─────────────────────────┬────────────────────────────────┐│
│  │ Boite de reception [5]  │ Sujet du message         [Lu] ││
│  │                         │                [Archive][Suppr]││
│  │ ┌─────────────────────┐ │                                ││
│  │ │●Jean Dupont   12/02 │ │ Recu le 12/02/2026            ││
│  │ │ Demande info        │ │ Tel: 06 12 34 56 78           ││
│  │ │ Bonjour, je voud... │ │ [Utilisateur inscrit]          ││
│  │ ├─────────────────────┤ │                                ││
│  │ │ Marie L.      11/02 │ │ ────────────────────          ││
│  │ │ Partenariat         │ │                                ││
│  │ │ Nous souhaitons...  │ │ Bonjour, je voudrais           ││
│  │ ├─────────────────────┤ │ des informations sur vos       ││
│  │ │ Paul M.       10/02 │ │ seminaires d'entreprise...     ││
│  │ │ Reclamation         │ │                                ││
│  │ │ Suite a notre...    │ │                                ││
│  │ └─────────────────────┘ │                                ││
│  │                         │ [Repondre par email]           ││
│  └─────────────────────────┴────────────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Moderation des avis (Admin / Employe)

```
┌──────────────────────────────────────────────────────────────┐
│  [Navigation]                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Gestion des avis  [3 en attente]              [Actualiser]  │
│                                                              │
│  [En attente (3)]  [Tous les avis (12)]                      │
│                                                              │
│  Vue "En attente" (cartes) :                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ Jean D. - Corp Inc      │  │ Marie L.                 │ │
│  │ ★★★★★                   │  │ ★★★★☆                   │ │
│  │ "Super prestation !"    │  │ "Tres bon service"      │ │
│  │ Contenu de l'avis...    │  │ Contenu...              │ │
│  │ [Evenement associe]     │  │                         │ │
│  │ 12/02/2026              │  │ 11/02/2026              │ │
│  │                         │  │                         │ │
│  │ [Valider] [★] [Refuser] │  │ [Valider] [★] [Refuser] │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
│  Vue "Tous les avis" (tableau) :                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Auteur  │ Titre          │ Note │ Statut │ Date │ Act. │ │
│  ├─────────┼────────────────┼──────┼────────┼──────┼──────┤ │
│  │ Jean D. │ Super ! [★]    │★★★★★│●Valide │12/02 │[★][X]│ │
│  │ Paul M. │ Correct        │★★★☆☆│●Attente│10/02 │[V][R]│ │
│  └────────────────────────────────────────────────────────┘ │
│  [★]=Mettre en avant [V]=Valider [R]=Refuser [X]=Supprimer │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# Wireframes Mobile (React Native / Expo)

L'application mobile est destinee aux employes terrain. L'interface est simplifiee pour un usage rapide sur smartphone.

## Mobile - Ecran de connexion

```
┌─────────────────────────┐
│                         │
│      INNOV'EVENTS       │
│        ─────────        │
│    Espace collaborateur  │
│                         │
│                         │
│  Email                  │
│  ┌─────────────────────┐│
│  │ jose@innovevents.fr ││
│  └─────────────────────┘│
│                         │
│  Mot de passe           │
│  ┌─────────────────────┐│
│  │ --------            ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │     Se connecter    ││
│  └─────────────────────┘│
│                         │
│   Mot de passe oublie ?  │
│                         │
│                         │
│  v1.0 - Innov'Events   │
└─────────────────────────┘
```

## Mobile - Dashboard employe

```
┌─────────────────────────┐
│ Menu  Dashboard   [Jose] │
├─────────────────────────┤
│                         │
│  Bonjour Jose !         │
│                         │
│  ┌────┐┌────┐┌────┐┌────┐
│  │  3 ││  2 ││  4 ││  8 │
│  │Todo││Cours││Evts││Cli.│
│  └────┘└────┘└────┘└────┘
│                         │
│  Mes taches             │
│  ───────────            │
│  ┌─────────────────────┐│
│  │ [Haute] Preparer    ││
│  │   salle - Seminaire ││
│  │   Echeance: 15/02   ││
│  │   [Demarrer]        ││
│  ├─────────────────────┤│
│  │ [Moy.] Commander    ││
│  │   traiteur - Gala   ││
│  │   [Terminer]        ││
│  └─────────────────────┘│
│                         │
│  Avis a valider  [2]   │
│  ───────────────────    │
│  ┌─────────────────────┐│
│  │ Super prestation !   ││
│  │ ★★★★★  Jean D.      ││
│  ├─────────────────────┤│
│  │ Bon service          ││
│  │ ★★★★☆  Marie L.     ││
│  └─────────────────────┘│
│  [Voir tous les avis]   │
│                         │
│  Prochains evenements   │
│  ─────────────────────  │
│  ┌─────────────────────┐│
│  │Event│Date │Lieu│Type ││
│  │Semin│15/02│Par.│Sem. ││
│  │Gala │20/02│Lyon│Soir.││
│  └─────────────────────┘│
│                         │
│  Clients                │
│  ────────               │
│  ┌─────────────────────┐│
│  │ Corp Inc             ││
│  │ Jean Dupont          ││
│  │ jean@corpinc.fr      ││
│  └─────────────────────┘│
│                         │
├─────────────────────────┤
│ [Dashboard] [Events] [+]│
└─────────────────────────┘
```

## Mobile - Detail evenement

```
┌─────────────────────────┐
│ <-  Detail evenement     │
├─────────────────────────┤
│                         │
│  Seminaire Tech         │
│  Solutions 2026         │
│                         │
│  Statut: ● En cours     │
│                         │
│  ┌─────────────────────┐│
│  │ Date  15 fevrier 26 ││
│  │ Lieu  Paris - Salle ││
│  │ Nb    50 participants││
│  │ Client Tech Solutions││
│  └─────────────────────┘│
│                         │
│  Prestations            │
│  ────────────           │
│  ┌─────────────────────┐│
│  │ Location salle  800E││
│  │ Traiteur      1500E ││
│  │ Sono + micro   400E ││
│  │ ────────────────── ││
│  │ Total HT     2700E ││
│  └─────────────────────┘│
│                         │
│  Notes collaboratives   │
│  ─────────────────────  │
│  ┌─────────────────────┐│
│  │ Jose - 10/02 14h    ││
│  │ "Salle confirmee    ││
│  │  par le prestataire" ││
│  ├─────────────────────┤│
│  │ Chloe - 09/02 11h   ││
│  │ "Client veut option ││
│  │  vegetarienne"       ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │ Ajouter une note... ││
│  └─────────────────────┘│
│  [Envoyer]              │
│                         │
│  Taches liees           │
│  ─────────────          │
│  [x] Reserver traiteur  │
│  [x] Confirmer salle    │
│  [ ] Preparer badges    │
│  [ ] Tester videoproj.  │
│                         │
├─────────────────────────┤
│ [Dashboard] [Events] [+]│
└─────────────────────────┘
```

## Notes

Ces wireframes ont ete faits au debut du projet pour se mettre d'accord sur la structure des pages. Le rendu final peut differer legerement mais l'esprit general est respecte.

Les wireframes web ont ete concus en format desktop. Les wireframes mobiles en format portrait smartphone (360px). On n'a pas utilise d'outil type Figma, les schemas ASCII suffisaient pour notre besoin.

Mise a jour : les wireframes ont ete revises en fevrier 2026 pour refleter l'etat reel de l'application apres developpement. Les ecarts principaux par rapport a la conception initiale :
- Navigation par header avec menu deroulant au lieu d'une sidebar
- Ajout de pages non prevues initialement (Evenements publics, Avis publics, Contact, Messages admin, Dashboard employe web)
- Dashboard admin enrichi avec plus de KPI et sections
- Espace client plus complet (stats, actions rapides, prochain evenement)
- Utilisation de modals pour les CRUD au lieu de pages separees
