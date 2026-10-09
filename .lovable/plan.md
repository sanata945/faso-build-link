# FasoLink Pro — Plan technique (V1)

Application web en français, conçue d'abord pour les téléphones Android et les connexions lentes. Elle met en relation des clients et des prestataires du bâtiment à Ouagadougou (plomberie, électricité, maintenance), avec une structure prête pour tout le Burkina Faso.

## 1. Parcours principaux

```text
Client :      Inscription -> Profil -> Publier une demande -> Recevoir des devis
              -> Comparer -> Accepter / Refuser -> Contrat -> Suivi -> Avis / Litige
Prestataire : Inscription -> Profil métier (catégories, villes) -> Voir les demandes
              -> Envoyer un devis -> Confirmer le contrat -> En cours -> Terminé
Admin :       Tableau de bord -> Utilisateurs, demandes, devis, contrats, litiges
```

Statuts d'une mission : nouvelle demande -> devis reçu -> accepté -> en cours -> terminé (ou annulé / litige à tout moment autorisé).

## 2. Pages

| Page | Accès | Contenu |
|---|---|---|
| Accueil | public | Présentation, catégories, boutons s'inscrire/se connecter |
| Connexion / Inscription | public | E-mail + mot de passe, choix client ou prestataire |
| Mon espace | connecté | Tableau de bord adapté au rôle |
| Profil | connecté | Nom, téléphone, ville, quartier ; métiers et description pour prestataire |
| Nouvelle demande | client | Catégorie, description, ville, quartier, budget, délai, photos (compressées) |
| Mes demandes / Détail | client | Liste, statut, devis reçus, comparaison côte à côte, accepter/refuser |
| Demandes disponibles | prestataire | Filtrées par ses catégories et sa ville |
| Envoyer un devis | prestataire | Prix total, matériaux, main-d'œuvre, délai, message |
| Mes devis | prestataire | Suivi de ses devis |
| Contrat | parties + admin | Fiche récapitulative, double confirmation, changement de statut |
| Admin | admin | Statistiques, liste utilisateurs (suspendre), demandes, devis, litiges |

Navigation par barre fixe en bas de l'écran (style application mobile), pages légères, pas d'animations lourdes, images compressées avant envoi.

## 3. Base de données (Lovable Cloud)

```text
profiles (id = utilisateur, nom, téléphone, ville_id, quartier, type_client, suspendu)
user_roles (user_id, role: client | prestataire | admin)        -- table séparée
cities (id, nom, actif)                    -- Ouagadougou actif, autres villes prêtes
categories (id, nom, actif)                -- plomberie, électricité, maintenance actifs
provider_profiles (user_id, métier, description, expérience, vérifié, note_moyenne)
provider_categories (provider_id, category_id)
provider_cities (provider_id, city_id)
job_requests (id, client_id, category_id, city_id, quartier, titre, description,
              budget_min, budget_max, délai, statut, créé_le)
job_photos (id, request_id, chemin_fichier)
quotes (id, request_id, provider_id, prix_total, matériaux, main_oeuvre, délai_jours,
        message, statut: envoyé | accepté | refusé | retiré)
contracts (id, request_id, quote_id, client_id, provider_id, montant,
           client_confirmé, prestataire_confirmé, statut)
payments (id, contract_id, montant, méthode, statut, référence_externe)  -- vide en V1
commissions (id, contract_id, taux, montant, statut)                      -- calcul préparé
reviews (id, contract_id, auteur_id, cible_id, note 1-5, commentaire)
disputes (id, contract_id, ouvert_par, motif, statut, résolution)
```

Chaque table a un identifiant unique (UUID) et des liens cohérents (une demande appartient à un client, un devis à une demande et un prestataire, un contrat à un devis accepté).

## 4. Sécurité et autorisations (côté serveur)

- Règles de sécurité appliquées par la base elle-même sur chaque table, pas seulement dans l'interface.
- Client : crée, lit et modifie uniquement ses propres demandes ; voit les devis reçus sur ses demandes.
- Prestataire : lit les demandes ouvertes, crée et modifie uniquement ses propres devis et son profil.
- Contrats, paiements, litiges : visibles uniquement par le client, le prestataire concernés et l'admin.
- Les actions sensibles (accepter un devis, créer le contrat, changer le statut) passent par des fonctions serveur qui vérifient le rôle et la propriété.
- Le rôle admin ne peut pas être choisi à l'inscription ; il est attribué manuellement à votre compte.
- Photos stockées dans un espace privé, accessibles seulement aux personnes concernées.
- Mots de passe gérés par le système de connexion (jamais stockés en clair), protection contre les mots de passe divulgués activée.

## 5. Paiement (préparé, non actif)

Tables `payments` et `commissions` créées mais aucune transaction réelle. Le contrat affiche « Paiement hors plateforme ». Un futur prestataire agréé (Orange Money, Moov Money, etc.) pourra être branché plus tard.

## 6. Étapes de réalisation

1. Design system (couleurs sobres inspirées du Burkina : vert, rouge terre, jaune), navigation mobile.
2. Activation de Lovable Cloud, création des tables, règles de sécurité, données de référence (villes, catégories).
3. Inscription / connexion, choix du rôle, profils.
4. Demandes de travaux (client) + photos.
5. Demandes disponibles et devis (prestataire).
6. Comparaison, acceptation/refus, contrat et suivi des statuts.
7. Avis et litiges.
8. Tableau de bord admin.
9. Données fictives de test + tests automatiques des règles clés + vérification des parcours client et prestataire dans le navigateur.

À chaque étape, je vous explique simplement comment fonctionnent les pages, la base et les autorisations.

## Détails techniques

- TanStack Start + Tailwind, Lovable Cloud (base Postgres, connexion, stockage), offres gratuites.
- Rôles vérifiés via une fonction `has_role` sécurisée ; politiques RLS sur toutes les tables.
- Pages protégées sous une zone réservée aux utilisateurs connectés ; fonctions serveur authentifiées pour les transitions de statut.
- Villes et catégories en tables (activation par simple drapeau) pour l'extension nationale.
