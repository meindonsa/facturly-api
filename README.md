# FACTURLY API

## Installation
1. Installation
```shell
npm install
```

2. Configurer le fichier d'environnement
``` shell
cp .env.example .env
```

3. Regénérer les clés de sécurité
```shell
node -e "
console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'));
"
```
Copiez les clés générées et remplacez dans le fichier .env

4. Base de données
```text
Définissez les valeur de votre base de données dans le fichier .env
```

5. Lancer le server
```shell
npm run dev
```
L'api sera accessible à l'adresse: http://localhost:3000
