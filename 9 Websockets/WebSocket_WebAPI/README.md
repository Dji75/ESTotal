# POC & Exercice : Web API WebSocket (Standard de l'industrie)

Bienvenue dans cet exercice pratique dédié à la **Web API standard `WebSocket`**. Contrairement à l'étude des trames binaires bas niveau, cet exercice se concentre sur les **meilleures pratiques de développement d'applications réelles et résilientes** en utilisant l'API standardisée par le W3C/WHATWG côté navigateur, et la bibliothèque de référence `ws` côté Node.js.

Vous allez manipuler l'état de la connexion, concevoir un protocole de messagerie structuré en JSON, implémenter de la résilience (reconnexion automatique) et gérer le cycle de vie de la communication client-serveur.

---

## 💡 Concepts Clés de la Web API WebSocket

### 1. La machine à états (`ws.readyState`)
L'instance de la classe native `WebSocket` possède une propriété `readyState` qui indique à tout moment l'état de la connexion. Les valeurs possibles sont :

| Constante | Valeur | Signification |
| :--- | :--- | :--- |
| `WebSocket.CONNECTING` | `0` | La connexion est en cours d'établissement. |
| `WebSocket.OPEN` | `1` | La connexion est établie et prête à communiquer. |
| `WebSocket.CLOSING` | `2` | La connexion est en cours de fermeture. |
| `WebSocket.CLOSED` | `3` | La connexion est fermée ou n'a pas pu s'ouvrir. |

### 2. Les Événements Clés de la Web API
La communication est asynchrone et entièrement basée sur les événements :

*   **`onopen`** : Déclenché dès que la connexion passe à l'état `OPEN` (poignée de main HTTP réussie).
*   **`onmessage`** : Déclenché lors de la réception de données. Les données reçues se trouvent dans `event.data` (qui peut être du texte, un `Blob` ou un `ArrayBuffer`).
*   **`onerror`** : Déclenché lorsqu'une erreur réseau ou protocolaire survient.
*   **`onclose`** : Déclenché lorsque la connexion se ferme. Cet événement fournit un code de fermeture (`event.code`) et éventuellement une raison textuelle (`event.reason`).

---

## 🎯 Exercices Pratiques à Réaliser

Les fichiers de départ sont déjà fonctionnels et fournissent une base saine de communication bidirectionnelle textuelle et binaire. Les exercices suivants vous permettront d'approfondir la résilience et les architectures de communication complexes.

### Exercice 1 : Implémenter la Reconnexion Automatique (Exponential Backoff)
Dans un réseau réel (mobile, Wi-Fi instable), la connexion WebSocket peut couper à tout moment. Si la connexion est coupée de façon inattendue, le client doit tenter de se reconnecter.
*   Dans `index.html`, repérez la fonction `connect()`.
*   Modifiez le gestionnaire d'événement `ws.onclose` pour lancer une tentative de reconnexion automatique après un certain délai.
*   **Challenge bonus :** Utilisez une stratégie de **reconnexion progressive (Exponential Backoff)** : attendez 1 seconde la première fois, puis 2 secondes, puis 4, puis 8... jusqu'à un maximum de 30 secondes, et remettez ce compteur à zéro dès que la connexion réussit (`onopen`).

### Exercice 2 : Système de Salons thématiques (Rooms)
Actuellement, tous les messages sont diffusés à tout le monde indistinctement (Broadcast général).
*   Structurez vos messages sous forme d'objets JSON avec un format type : `{ "action": "nom-action", "payload": { ... } }`.
*   Dans l'interface graphique `index.html`, ajoutez un sélecteur (`<select>`) permettant à l'utilisateur de choisir un salon de discussion (ex: `Salon JavaScript`, `Salon WebSockets`).
*   Modifiez `server.js` pour suivre dans quel salon se trouve chaque client.
*   Lorsqu'un utilisateur change de salon, le client envoie un message `{ "action": "join", "payload": { "room": "nom-du-salon" } }`.
*   Le serveur doit ensuite s'assurer de ne diffuser les messages d'un salon **qu'aux clients actuellement abonnés à ce même salon**.

### Exercice 3 : Heartbeat / Keep-Alive (Détection des connexions mortes)
Parfois, une connexion réseau se coupe sans que l'événement `onclose` ne soit levé côté serveur (perte de réseau totale, veille du client, etc.). On parle de "Half-Open connection".
*   Dans `server.js`, implémentez un mécanisme de **Heartbeat** actif.
*   Toutes les 30 secondes, parcourez l'ensemble des clients connectés, marquez-les comme inactifs (`client.isAlive = false`) et envoyez-leur un Ping avec `client.ping()`.
*   Côté serveur, écoutez l'événement `pong` sur chaque socket (`client.on('pong', ...)`). Dès que vous recevez un Pong, repassez l'indicateur à `client.isAlive = true`.
*   Au cycle suivant, si un client est toujours marqué `isAlive === false`, fermez sa socket de force (`client.terminate()`).

### Exercice 4 : Partage de Dessin en Temps Réel (Données Binaires)
La Web API WebSocket gère nativement le binaire (`Blob` et `ArrayBuffer`).
*   Modifiez la configuration de la socket client pour utiliser le binaire : `ws.binaryType = "arraybuffer"`.
*   Implémentez un mini tableau blanc (un élément `<canvas>`) interactif dans `index.html`.
*   Lorsque le client dessine sur son canvas, envoyez les coordonnées `(X, Y)` sous forme de tableau binaire compressé (par exemple : un `Uint16Array` de 4 octets) à travers la socket.
*   Le serveur reçoit ces trames binaires et les retransmet à tous les autres clients, qui dessineront à leur tour en temps réel sur leur canvas respectif !

---

## 🛠️ Installation et Démarrage

1. Accédez au répertoire de l'exercice :
   ```bash
   cd poc_websocket
   ```

2. Installez la bibliothèque standard WebSocket de Node.js (`ws`) :
   ```bash
   npm install
   ```

3. Démarrez le serveur :
   ```bash
   npm start
   ```

4. Ouvrez votre navigateur sur [http://localhost:3000](http://localhost:3000) !
