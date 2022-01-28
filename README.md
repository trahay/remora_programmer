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
    apt-get install nodejs npm sqlite3 python-requests

## Installation

Télécharger remora_programmer:
    git clone https://github.com/trahay/remora_programmer.git

Installer les modules nodejs nécessaires:
    npm install .

Changer les identifiants de connexion: éditer le fichier auth.js:
      'JohnDoe': { password: 'SuperSecurePassword' },

Initialiser tout:
   bash ./install_remora_programmer.sh

## Lancement et initialisation du serveur web

Lancer le serveur web:
    sudo systemctl restart remora_programmer 

Vous pouvez ensuite vous connecter au serveur sur le port 8080.

Sur le site web vous pouvez définir des programmes et les appliquer aux différentes zones

![Page d'accueil](https://github.com/trahay/remora_programmer/blob/master/doc/screenshots/home.png)

### Définir un programme de journée

Un programme de journée indique pour chaque instant de la journée (avec une granularité de 15 minutes), quel mode (Confort, Eco, Hors-gel ou Arret) utiliser.

Pour définir un programme, donnez lui un nom et pour chaque intervale de temps, indiquez le mode à appliquer.

![Définition d'un programme de journée](https://github.com/trahay/remora_programmer/blob/master/doc/screenshots/programme_journee.png)

### Définir un programme de semaine

Un programme de semaine indique, pour chaque jour de la semaine, quel programme de journée appliquer.

![Définition d'un programme de semaine](https://github.com/trahay/remora_programmer/blob/master/doc/screenshots/programme_semaine.png)

### Définir une zone

Pour définir une zone, choisissez un nom, un programme de semaine à
appliquer, et indiquez l'url du remora correspondant. L'URL est sous
la forme `http://ip_du_remora/fpX` où X est le numéro du fil pilote
correspondant à la zone.

![Définition d'une zone](https://github.com/trahay/remora_programmer/blob/master/doc/screenshots/zone.png)


## Installation du script cron

Installer un cron qui enverra régulièrement les commandes au Remora
   ./install_cron.sh
