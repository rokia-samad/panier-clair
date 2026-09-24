# Organisation du projet

`src/` contient le code à modifier. `content.js` est généré par `node scripts/build.mjs` et reste à la racine pour que Firefox puisse charger directement `manifest.json` sans dépendance ni compilation externe.

| Fichier | Responsabilité |
| --- | --- |
| `src/runtime.js` | Configuration et état de la page. |
| `src/core/gtin.js` | Lecture et validation des codes-barres. |
| `src/sites/leclerc.js` | Extraction des produits et emplacements sur E.Leclerc Drive. |
| `src/data/openfoodfacts.js` | Requêtes Open Food Facts et cache local. |
| `src/ui/widget.js` | Encarts et code-barres à scanner. |
| `src/main.js` | Observation de la page et montage des encarts. |
| `scripts/build.mjs` | Assemble les sources dans `content.js`. |

Les fichiers de `src/` partagent un même contexte, dans l’ordre défini par `scripts/build.mjs` : il faut conserver cet ordre lorsque des fonctions dépendent les unes des autres. Sur une fiche Leclerc, l’encart attend le titre du produit et l’observateur le replace sous ce titre si la page le déplace.

## Ajouter un site

1. Créer `src/sites/<site>.js` avec sa propre extraction du code-barres et des éléments où afficher les encarts.
2. Ajouter le nouvel adaptateur à `siteAdapters` dans `src/main.js`, puis inscrire son fichier dans `scripts/build.mjs`.
3. Ajouter uniquement le domaine nécessaire dans `host_permissions` et `content_scripts.matches` du manifeste Firefox.
4. Tester les fiches et listes du site, les pages sans code-barres, la limite de requêtes et les changements dynamiques du DOM. Mettre à jour la politique de confidentialité et la fiche du store.

## Firefox et Chrome

`manifest.json` reste le manifeste Firefox, avec son identifiant Gecko et ses métadonnées propres à AMO. `manifest.chrome.json` décrit le paquet Chromium : il retire ces champs Firefox et utilise les icônes PNG du navigateur. `scripts/build-content.mjs` assemble la même interface depuis les sources, avec un adaptateur de récupération OFF dédié à Chrome.

Dans Chrome, le script injecté ne peut pas effectuer lui-même la requête cross-origin vers Open Food Facts. Il envoie uniquement un code-barres au service worker, qui vérifie que l’émetteur est une page HTTPS E.Leclerc Drive et que le code a une longueur GTIN reconnue avant la requête fixe vers Open Food Facts. Aucun URL fourni par la page n’est accepté. Cette voie garde le cache, le délai et la limite de recherches de la logique partagée. L’archive de test Chrome est générée avec `node scripts/package-chrome.mjs`; elle doit encore être testée dans Chrome réel avant toute publication au Chrome Web Store.

## Vérification et publication

Exécuter `node scripts/build.mjs`, puis `node scripts/build.mjs --check`, `node --check content.js`, `python3 -m json.tool manifest.json` et `git diff --check`. Charger ensuite `manifest.json` dans Firefox via `about:debugging` et vérifier une page E.Leclerc Drive. Pour Firefox, produire les paquets avec `node scripts/package.mjs` et `node scripts/package-source.mjs`. Pour Chrome, générer le ZIP séparé avec `node scripts/package-chrome.mjs`, charger le dossier extrait dans `chrome://extensions`, puis vérifier le chargement, la requête OFF via le service worker, le stockage local, l’affichage et les interactions sur des pages réelles avant publication.
