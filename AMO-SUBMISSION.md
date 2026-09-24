# Mettre à jour l’extension publiée sur Mozilla Add-ons

L’extension est déjà [publiée sur Mozilla Add-ons](https://addons.mozilla.org/fr/firefox/addon/panier-etiq/). Pour une nouvelle version :

1. Vérifier que le nom **Panier Etiq** est cohérent dans le manifeste, le popup, la fiche et la politique de confidentialité.
2. Conserver l’identifiant `browser_specific_settings.gecko.id` du manifeste pour que Mozilla reconnaisse les mises à jour de la même extension.
3. Incrémenter `version` dans `manifest.json`, mettre à jour la version du popup et ajouter la note dans [CHANGELOG.md](CHANGELOG.md), puis exécuter `node scripts/build.mjs` et les vérifications de [ARCHITECTURE.md](ARCHITECTURE.md).
4. Tester la version temporairement dans Firefox sur E.Leclerc Drive, puis créer le paquet non signé avec `node scripts/package.mjs`.
5. Créer aussi l’archive des sources avec `node scripts/package-source.mjs`. Le fichier `SOURCE-README.md` explique aux réviseurs comment reproduire `content.js`; l’archive inclut aussi `CHANGELOG.md`.
6. Envoyer le paquet XPI comme **nouvelle version de l’extension existante** dans le tableau de bord développeur Mozilla. Quand Mozilla demande si le code est généré, répondre **oui** et joindre l’archive des sources. Mettre à jour le nom et la description publique à partir de `AMO-LISTING.md`, puis vérifier la fiche après validation.
