/**
 * Logique client WebSocket et gestion de l'interface utilisateur
 * ---------------------------------------------------------------
 * Ce fichier gère la connexion réseau avec le serveur,
 * la structuration des messages au format JSON, le protocole binaire
 * pour le dessin partagé et la gestion de la reconnexion automatique.
 */

let ws = null;
let reconnectDelay = 1000; // Délai initial de reconnexion en ms (1 seconde)
const maxReconnectDelay = 30000; // Délai maximum de reconnexion (30 secondes)
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Éléments du DOM (on attend le chargement complet du DOM pour les assigner)
let term, badge, badgeText, wsReadyStateLabel, btnConnect, btnDisconnect, chatInput, btnSendChat, roomSelect, canvas, ctx;

document.addEventListener('DOMContentLoaded', () => {
  term = document.getElementById('terminal');
  badge = document.getElementById('conn-badge');
  badgeText = document.getElementById('conn-text');
  wsReadyStateLabel = document.getElementById('ws-ready-state');
  btnConnect = document.getElementById('btn-connect');
  btnDisconnect = document.getElementById('btn-disconnect');
  chatInput = document.getElementById('chat-input');
  btnSendChat = document.getElementById('btn-send-chat');
  roomSelect = document.getElementById('room-select');
  canvas = document.getElementById('paint-canvas');
  ctx = canvas.getContext('2d');

  // Configuration par défaut du pinceau
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  // Liaison des événements de dessin du canvas
  setupCanvasEvents();
  
  addLog('info', 'Application initialisée. Appuyez sur "Se connecter" pour commencer l\'activité.');
});

function addLog(tag, msg) {
  if (!term) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');
  
  const line = document.createElement('div');
  line.className = 'log-line';

  const meta = document.createElement('div');
  meta.className = 'log-meta';

  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = timeStr;

  const tagSpan = document.createElement('span');
  tagSpan.className = `log-tag ${tag}`;
  tagSpan.textContent = tag;

  meta.appendChild(timeSpan);
  meta.appendChild(tagSpan);

  const msgSpan = document.createElement('span');
  msgSpan.className = 'log-msg';
  msgSpan.textContent = msg;

  line.appendChild(meta);
  line.appendChild(msgSpan);
  term.appendChild(line);

  // Scroll automatique
  term.scrollTop = term.scrollHeight;
}

window.clearTerminal = function() {
  if (term) term.innerHTML = '';
  addLog('info', 'Console de débug nettoyée.');
};

function updateReadyStateDisplay() {
  if (!wsReadyStateLabel) return;
  if (!ws) {
    wsReadyStateLabel.textContent = "CLOSED (3)";
    return;
  }
  
  const states = {
    0: 'CONNECTING (0)',
    1: 'OPEN (1)',
    2: 'CLOSING (2)',
    3: 'CLOSED (3)'
  };
  
  wsReadyStateLabel.textContent = states[ws.readyState] || `UNKNOWN (${ws.readyState})`;
}

function setUIState(state) {
  updateReadyStateDisplay();
  if (!badge) return;

  if (state === 'disconnected') {
    badge.className = 'status-badge';
    badgeText.textContent = 'Déconnecté';
    
    btnConnect.disabled = false;
    btnDisconnect.disabled = true;
    chatInput.disabled = true;
    btnSendChat.disabled = true;
    roomSelect.disabled = true;
  } 
  else if (state === 'connecting') {
    badge.className = 'status-badge connecting';
    badgeText.textContent = 'Connexion...';
    
    btnConnect.disabled = true;
    btnDisconnect.disabled = true;
  } 
  else if (state === 'connected') {
    badge.className = 'status-badge connected';
    badgeText.textContent = 'Connecté';
    
    btnConnect.disabled = true;
    btnDisconnect.disabled = false;
    chatInput.disabled = false;
    btnSendChat.disabled = false;
    roomSelect.disabled = false;
    chatInput.focus();
  }
}

// 1. Établissement de la connexion WebSocket (Web API standard)
function connect() {
  const url = "ws://localhost:3000";
  addLog('info', `Appel constructeur : new WebSocket("${url}")...`);
  setUIState('connecting');

  try {
    ws = new WebSocket(url);

    // [EXERCICE 4] Indique que nous recevrons du binaire sous forme d'ArrayBuffer
    ws.binaryType = "arraybuffer"; 
    document.getElementById('ws-binary-type').textContent = ws.binaryType;

    // Événement d'ouverture (Connexion établie)
    ws.addEventListener('open', (event) => {
      addLog('info', 'Événement [open] capturé via addEventListener ! Connexion établie avec le serveur.');
      setUIState('connected');
      
      // Réinitialiser le délai de reconnexion en cas de succès [EXERCICE 1]
      reconnectDelay = 1000;
    });

    // Événement de réception de message
    ws.addEventListener('message', (event) => {
      // Gestion des trames binaires (Exercice 4 : Réception de coordonnées de dessin)
      if (event.data instanceof ArrayBuffer) {
        handleBinaryDrawing(event.data);
        return;
      }

      // Gestion des messages texte (JSON structuré)
      addLog('recv', `[Texte brut reçu] ${event.data}`);
      try {
        const parsed = JSON.parse(event.data);
        
        if (parsed.type === 'system') {
          addLog('info', `📢 SYSTÈME : ${parsed.message}`);
        } 
        else if (parsed.type === 'chat') {
          addLog('recv', `💬 [${parsed.room}] ${parsed.username} dit : ${parsed.message}`);
        }
      } catch (e) {
        addLog('recv', `Message non-JSON : ${event.data}`);
      }
    });

    // Événement d'erreur réseau/protocole
    ws.addEventListener('error', (error) => {
      addLog('err', 'Événement [error] détecté via addEventListener ! Une anomalie réseau est survenue.');
      updateReadyStateDisplay();
    });

    // Événement de déconnexion
    ws.addEventListener('close', (event) => {
      addLog('info', `Événement [close] capturé via addEventListener. Proprement fermé : ${event.wasClean}, Code : ${event.code}, Raison : "${event.reason || 'aucune'}"`);
      setUIState('disconnected');
      ws = null;

      // ========================================================================
      // [EXERCICE 1] : CODER LA RECONNEXION AUTOMATIQUE (EXPONENTIAL BACKOFF)
      // ------------------------------------------------------------------------
      // Si la déconnexion n'est pas volontaire (ex: code !== 1000), tentez de
      // vous reconnecter automatiquement en augmentant le délai d'attente.
      // ========================================================================
      if (event.code !== 1000) {
        addLog('info', `Reconnexion automatique programmée dans ${reconnectDelay / 1000} secondes...`);
        
        setTimeout(() => {
          addLog('info', 'Tentative de reconnexion automatique en cours...');
          connect();
        }, reconnectDelay);

        // Double le délai d'attente pour la prochaine tentative (Exponential Backoff)
        reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
      }
    });

  } catch (err) {
    addLog('err', `Erreur critique lors de la création de l'objet WebSocket : ${err.message}`);
    setUIState('disconnected');
  }
}

window.triggerConnect = function() {
  reconnectDelay = 1000; // Reset
  connect();
};

window.triggerDisconnect = function() {
  if (ws) {
    addLog('info', 'Fermeture volontaire requise : ws.close(1000)...');
    ws.close(1000, "Déconnexion volontaire du client");
  }
};

// 2. Gestion de l'Espace Discussion (Exercice 2 : JSON Actions)
window.sendChatMessage = function(event) {
  if (event) event.preventDefault();
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  // On formule le message au format JSON standard structuré
  const payload = {
    action: 'message',
    payload: {
      text: text
    }
  };

  addLog('sent', JSON.stringify(payload));
  ws.send(JSON.stringify(payload));
  
  input.value = '';
  input.focus();
};

// [EXERCICE 2] Actionneur de changement de salon thématique
window.onRoomChanged = function() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  
  const selectedRoom = roomSelect.value;
  addLog('info', `Demande d'adhésion au salon : "${selectedRoom}"`);

  // Fabriquez et émettez l'action JSON correspondante
  const payload = {
    action: 'join',
    payload: {
      room: selectedRoom
    }
  };

  addLog('sent', JSON.stringify(payload));
  ws.send(JSON.stringify(payload));
};


// ========================================================================
// [EXERCICE 4] : TABLEAU BLANC COLLABORATIF EN TRACE BINAIRE
// ========================================================================
function setupCanvasEvents() {
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Dessiner localement
    drawSegment(lastX, lastY, currentX, currentY, '#3b82f6');

    // Émission binaire via WebSocket
    sendDrawingBinaryFrame(0, lastX, lastY, currentX, currentY);

    lastX = currentX;
    lastY = currentY;
  });

  canvas.addEventListener('mouseup', () => {
    if (!isDrawing) return;
    isDrawing = false;
    sendDrawingBinaryFrame(1, 0, 0, 0, 0);
  });

  canvas.addEventListener('mouseleave', () => {
    if (!isDrawing) return;
    isDrawing = false;
    sendDrawingBinaryFrame(1, 0, 0, 0, 0);
  });
}

function drawSegment(x1, y1, x2, y2, color) {
  if (!ctx) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.closePath();
}

function sendDrawingBinaryFrame(status, x1, y1, x2, y2) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const buffer = new Uint16Array([status, Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)]);
  ws.send(buffer.buffer);
}

function handleBinaryDrawing(arrayBuffer) {
  const view = new Uint16Array(arrayBuffer);
  const status = view[0];
  
  if (status === 1) return;
  
  const x1 = view[1];
  const y1 = view[2];
  const x2 = view[3];
  const y2 = view[4];

  drawSegment(x1, y1, x2, y2, '#ec4899');
}

window.clearCanvas = function() {
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    addLog('info', 'Tableau blanc réinitialisé localement.');
  }
};
