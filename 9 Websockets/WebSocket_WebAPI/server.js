/**
 * Serveur standard basé sur la bibliothèque 'ws' (Standard de l'industrie)
 * ----------------------------------------------------------------------
 * Ce serveur utilise le package de référence 'ws' pour gérer de manière robuste
 * les cycles de vie des connexions WebSockets au-dessus d'un serveur HTTP natif.
 * 
 * Il sert également la page cliente 'index.html' sur http://localhost:3000.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

// Recréer __dirname en mode ESM (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// 1. Serveur HTTP natif pour diffuser l'interface cliente (index.html) et son script (client.js)
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erreur interne lors du chargement de index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else if (req.url === '/client.js') {
    fs.readFile(path.join(__dirname, 'client.js'), 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Fichier client.js introuvable');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Ressource introuvable');
  }
});

// 2. Initialisation du WebSocket Server rattaché au serveur HTTP
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`\n[SERVER] Nouvelle connexion établie depuis : ${clientIp}`);

  // Configuration initiale de la socket du client
  ws.username = `Utilisateur_${Math.floor(1000 + Math.random() * 9000)}`;
  ws.room = 'Général'; // Par défaut, tout le monde est dans le salon Général [EXERCICE 2]
  ws.isAlive = true;   // Indicateur de statut de connexion pour le Heartbeat [EXERCICE 3]

  // Envoi d'un message d'accueil structuré au format JSON
  const welcomePayload = {
    type: 'system',
    message: `Bienvenue ${ws.username} ! Vous êtes connecté sur le salon "${ws.room}".`
  };
  ws.send(JSON.stringify(welcomePayload));

  // Notification de l'arrivée du nouvel utilisateur aux autres clients du même salon
  broadcast({
    type: 'system',
    message: `${ws.username} a rejoint la discussion.`
  }, ws, ws.room);

  // Écoute des messages en provenance du client
  ws.on('message', (rawData, isBinary) => {
    // Événement binaire (utilisé pour l'exercice 4 de dessin collaboratif)
    if (isBinary) {
      console.log(`[SERVER] Trame binaire reçue de ${ws.username} (${rawData.length} octets)`);
      // Rediffusion de la trame binaire brute aux autres membres
      broadcastBinary(rawData, ws);
      return;
    }

    // Événement textuel
    const textMessage = rawData.toString('utf8');
    console.log(`[SERVER] Reçu de ${ws.username} : "${textMessage}"`);

    try {
      // Protocole Structuré JSON (Bonne pratique de production)
      const parsed = JSON.parse(textMessage);

      // [EXERCICE 2] : Rejoindre un autre salon (Room Join)
      if (parsed.action === 'join') {
        const oldRoom = ws.room;
        const newRoom = parsed.payload.room || 'Général';
        ws.room = newRoom;

        // Prévenir l'ancien salon du départ
        broadcast({
          type: 'system',
          message: `${ws.username} a quitté ce salon pour rejoindre "${newRoom}".`
        }, ws, oldRoom);

        // Confirmer le changement au client lui-même
        ws.send(JSON.stringify({
          type: 'system',
          message: `Vous êtes bien entré dans le salon "${newRoom}".`
        }));

        // Prévenir le nouveau salon de l'arrivée
        broadcast({
          type: 'system',
          message: `${ws.username} s'est connecté à ce salon.`
        }, ws, newRoom);
        return;
      }

      // [EXERCICE 2] : Action d'envoi de chat normal
      if (parsed.action === 'message') {
        const userText = parsed.payload.text;
        
        // Diffusion uniquement aux membres du même salon
        broadcast({
          type: 'chat',
          username: ws.username,
          room: ws.room,
          message: userText
        }, null, ws.room);
        return;
      }

    } catch (err) {
      // Fallback si les données ne sont pas du JSON : on broadcast au salon courant
      broadcast({
        type: 'chat',
        username: ws.username,
        room: ws.room,
        message: textMessage
      }, null, ws.room);
    }
  });

  // Réception automatique du pong du navigateur (Exercice 3)
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Gestion de la perte de connexion du client
  ws.on('close', (code, reason) => {
    console.log(`[SERVER] Connexion fermée pour ${ws.username}. Code: ${code}`);
    broadcast({
      type: 'system',
      message: `${ws.username} est parti.`
    }, ws, ws.room);
  });

  // Gestion des anomalies réseaux
  ws.on('error', (err) => {
    console.error(`[SERVER ERROR] ${ws.username} :`, err.message);
  });
});

/**
 * Fonction utilitaire : Diffuse un objet JSON à un groupe de clients.
 * @param {Object} obj - Objet JavaScript à encoder en JSON.
 * @param {WebSocket} excludeWs - (Optionnel) Exclure ce client (généralement l'expéditeur).
 * @param {string} roomFilter - (Optionnel) Restreindre la diffusion à un salon particulier.
 */
function broadcast(obj, excludeWs = null, roomFilter = null) {
  const payload = JSON.stringify(obj);

  wss.clients.forEach((client) => {
    // On ne cible que les connexions actives (READYSTATE 1 === OPEN)
    if (client.readyState === 1) {
      const isSender = (client === excludeWs);
      const isSameRoom = !roomFilter || (client.room === roomFilter);

      if (!isSender && isSameRoom) {
        client.send(payload);
      }
    }
  });
}

/**
 * Fonction utilitaire : Diffuse des données binaires brutes.
 * @param {Buffer} buffer - Buffer brut reçu par le serveur.
 * @param {WebSocket} excludeWs - Client à exclure du broadcast.
 */
function broadcastBinary(buffer, excludeWs = null) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      const isSender = (client === excludeWs);
      if (!isSender) {
        // Envoi binaire natif
        client.send(buffer, { binary: true });
      }
    }
  });
}

// [EXERCICE 3] Heartbeat : Vérifie la santé des sockets de façon proactive toutes les 30s
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.isAlive === false) {
      console.log(`[HEARTBEAT] Client inactif ${client.username} détecté. Résiliation forcée...`);
      return client.terminate(); // Ferme immédiatement la connexion TCP sous-jacente
    }

    client.isAlive = false;
    client.ping(); // Envoi d'un Ping WebSocket bas niveau (le navigateur répond automatiquement par un Pong)
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// 3. Lancement de l'écoute du serveur HTTP/WS
server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 Serveur Web API WebSocket actif et prêt.`);
  console.log(`👉 Ouvrez votre navigateur sur : http://localhost:${PORT}`);
  console.log(`=============================================================\n`);
});
