# Faso Build Link

Crée une application web responsive appelée FasoLink Pro, destinée au Burkina Faso. L’interface doit être en français, simple à utiliser sur un téléphone Android, avec un design professionnel, rapide et adapté à une connexion Internet limitée.



Objectif : mettre en relation des clients et des prestataires du bâtiment pour des demandes de travaux, des devis et des contrats.



Utilisateurs :



1. Clients : particuliers, entreprises, propriétaires et gestionnaires d’immeubles.

2. Prestataires : maçons, plombiers, électriciens, peintres, carreleurs et professionnels de la maintenance.

3. Administrateur : moi, pour gérer les utilisateurs, les demandes, les devis et les signalements.



Fonctionnalités de la première version :



- Inscription et connexion sécurisées.

- Profil client et profil prestataire.

- Publication d’une demande de travaux avec catégorie, description, ville, quartier, budget indicatif, délai et photos facultatives.

- Consultation des demandes pertinentes par les prestataires.

- Envoi d’un devis indiquant prix, matériaux, main-d’œuvre et délai.

- Consultation et comparaison des devis par le client.

- Acceptation ou refus explicite d’un devis.

- Création d’une fiche de contrat après acceptation par les deux parties.

- Suivi du statut de la mission : nouvelle demande, devis reçu, accepté, en cours, terminé, annulé ou litige.

- Tableau de bord administrateur.

- Interface légère et utilisable sur petit écran.



Base de données : utilisateurs, profils prestataires, demandes, devis, contrats, paiements, commissions, avis et litiges, avec des identifiants uniques et des relations cohérentes.



Sécurité :



- Un client ne peut modifier que ses propres demandes.

- Un prestataire ne peut modifier que ses propres devis et son profil.

- Les contrats ne sont visibles que par les parties concernées et les administrateurs autorisés.

- Les rôles et autorisations doivent être contrôlés côté serveur, pas seulement dans l’interface.

- Ne jamais exposer de mots de passe, de clés secrètes ou de données privées.

- Utiliser des données fictives pendant les tests.



Contraintes de lancement :



- Commencer par Ouagadougou et les secteurs plomberie, électricité et maintenance.

- Prévoir une architecture extensible à tout le Burkina Faso.

- Utiliser des outils gratuits ou des offres gratuites quand c’est possible.

- Ne pas intégrer de paiement réel dans cette première version.

- Préparer le système pour ajouter ultérieurement un prestataire de paiement autorisé, après vérification des obligations applicables.

- Générer le code et m’expliquer progressivement comment fonctionnent les pages, la base de données et les autorisations.



Commence par établir le plan technique et le schéma de la base de données. Ensuite, crée le prototype fonctionnel étape par étape et teste les principaux parcours client et prestataire avant de le déclarer prêt à tester.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://faso-build-link.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/62f611f7-9ff6-4a67-8618-f01a05751707).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
