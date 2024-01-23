

const express = require('express');
const http = require('http');
const { Server } = require('ws');
const uuid = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const wss = new Server({
  server,
  verifyClient: (info, done) => {
        // Check the origin of the WebSocket connection
       // remember to add an allowed origin later
    const origin = info.origin || info.req.headers.origin;
    const allowedOrigins = ['http://localhost:3000']; //make sure again once that the react app is working on 3000 only or not, last change 9:55

    if (allowedOrigins.includes(origin)) {
      done(true);
    } else {
      done(false, 403, 'Forbidden');
    }
  }
});

const documents = {};
const users = {};

wss.on('connection', (socket) => {
  console.log('User connected');

  socket.on('message', (message) => {
    const data = JSON.parse(message);

        //  for when someone wants to join a document

    if (data.type === 'join-document') {
      const { documentId, userId } = data.payload;

         // ID etc stuff

      socket.documentId = documentId;
      socket.userId = userId;

      if (!documents[documentId]) {
        documents[documentId] = { content: '', users: {} };
      }

      documents[documentId].users[socket.userId] = socket;
      sendDocumentContent(documentId);
    } else if (data.type === 'update-document') {
      const { documentId, content } = data.payload;
      documents[documentId].content = content;

      // Share the content with everyone in the document
      broadcastDocumentContent(documentId, content);
    }
  });

  socket.on('close', () => {
    console.log('User disconnected');
    const { documentId, userId } = socket;
    if (documentId && userId && documents[documentId]?.users[userId]) {
      delete documents[documentId].users[userId];
      broadcastDocumentContent(documentId, documents[documentId].content);
    }
  });
});

function sendDocumentContent(documentId) {
  if (documents[documentId]) {
    const content = documents[documentId].content;
    const sockets = Object.values(documents[documentId].users);
    sockets.forEach((socket) => {
      socket.send(JSON.stringify({ type: 'document-content', payload: content }));
    });
  }
}

function broadcastDocumentContent(documentId, content) {
  if (documents[documentId]) {
    const sockets = Object.values(documents[documentId].users);
    sockets.forEach((socket) => {
      socket.send(JSON.stringify({ type: 'document-content', payload: content }));
    });
  }
}


//3000 and 5000 have already been tried(failed)
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



