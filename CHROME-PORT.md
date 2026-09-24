# Portage Chrome

Panier Etiq utilise Manifest V3. Le portage conserve l’interface, les pages E.Leclerc Drive prises en charge, Open Food Facts, les champs demandés, le cache local de 24 heures, la limite de dix recherches automatiques par page et l’espacement de quatre secondes.

## Adaptations propres à Chrome

- `manifest.chrome.json` retire les métadonnées Gecko et définit le service worker requis pour les requêtes cross-origin.
- Chrome interdit au script de contenu d’interroger Open Food Facts directement, même avec l’hôte déclaré. La variante Chrome envoie le seul code-barres au service worker. Celui-ci vérifie l’origine HTTPS E.Leclerc Drive et les longueurs GTIN prises en charge, puis construit lui-même la requête fixe vers l’API Open Food Facts.
- Les icônes de manifeste sont fournies en PNG aux tailles 48 × 48 et 128 × 128 ; Chrome n’accepte pas les SVG dans le manifeste.
- Chrome 99 est le minimum déclaré afin d’utiliser les promesses des API Storage et Runtime sans changer le code de cache partagé.

## Générer et charger le paquet

Depuis la racine du dépôt :

```sh
node scripts/package-chrome.mjs
```

Décompresser `dist/panier-etiq-0.3.3-chrome.zip`, ouvrir `chrome://extensions`, activer le mode développeur et charger le dossier décompressé avec **Charger l’extension non empaquetée**.

## État

Le mainteneur a chargé et testé l’extension dans Chrome, et confirme que son fonctionnement est réussi. La publication sur le Chrome Web Store n’a pas été effectuée.
