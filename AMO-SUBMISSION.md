# Rendre Panier Clair permanent dans Firefox

Firefox standard n’installe durablement que les extensions signées par Mozilla.

1. Créez ou ouvrez votre compte sur [addons.mozilla.org](https://addons.mozilla.org/developers/).
2. Choisissez **Soumettre un nouveau module** puis **Sur votre propre site** (extension non répertoriée).
3. Envoyez `dist/panier-clair-0.2.0-unsigned.xpi`.
4. Téléchargez le fichier `.xpi` signé que Mozilla fournit.
5. Dans Firefox, ouvrez `about:addons`, cliquez sur la roue dentée, choisissez **Installer un module depuis un fichier**, puis sélectionnez le `.xpi` signé.

L’extension restera installée après le redémarrage de Firefox.
