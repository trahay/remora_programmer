# remora_programmer

Un programmateur simple pour Remora.

**TL;DR:** remora_programmer permet de programmer des radiateurs connectés via Remora depuis un serveur (par exemple, un raspbery pi)

Un serveur web permet de définir des programmes journaliers et semainiers, et de choisir le programme à appliquer à chaque zone.
Un script cron est lancé régulièrement et communique avec le Remora pour appliquer le programme aux différentes zones.

## Disclaimer
Ce projet est très mal codé. Il m'a servi à me familiariser des technos web de type NodeJS. En regardant le résultat, on voit bien que je ne suis pas un développeur web :)


## Dépendances

Il faut un Remora installé et connecté au réseau.
   
A installer:
    apt-get install nodejs npm

Il faut également installer mongodb. Malheureusement, seule une version très ancienne (2.4) est packagée sous Raspbian stretch. Il faut donc utiliser cette méthode pour installer une version plus récente:
https://andyfelong.com/2016/01/mongodb-3-0-9-binaries-for-raspberry-pi-2-jessie/

## Installation

Commencer par récupérer les modules nécessaires:
    npm installgit@github.com:trahay/remora_programmer.git

Changer les identifiants de connexion: éditer le fichier auth.js:
      'JohnDoe': { password: 'SuperSecurePassword' },

Lancer le serveur web:
    nodejs server.js