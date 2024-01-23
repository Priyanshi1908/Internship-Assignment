import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';


const socket = new WebSocket('ws://localhost:5001');

function App() {
  const [documentId, setDocumentId] = useState(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    const userId = uuidv4();

    const handleWebSocketMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'document-content') {
        setContent(data.payload);
      }
    };

     // Function to open the WebSocket connection.
    const openWebSocketConnection = () => {
      socket.addEventListener('message', handleWebSocketMessage);

      if (documentId) {
                // Send a request to join the document with user ID.
        socket.send(JSON.stringify({ type: 'join-document', payload: { documentId, userId } }));
      }

      return () => {

        // If the WebSocket is open, leave the document before disconnecting.
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'leave-document', payload: { documentId } }));
        }
         
        // If the WebSocket is open or connecting, remove event listener and close the connection.
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.removeEventListener('message', handleWebSocketMessage);
          socket.close();
        }
      };
    };

    // Ensure the WebSocket connection is open before attempting to join a document
    if (socket.readyState === WebSocket.OPEN) {
      openWebSocketConnection();
    } else {
      // If the WebSocket connection is not open, wait for it to open before proceeding
      socket.addEventListener('open', openWebSocketConnection);
    }

  }, [documentId]);

  const handleCreateDocument = () => {
    const newDocumentId = uuidv4();
    setDocumentId(newDocumentId);
  };

  const handleUpdateDocument = (newContent) => {

   // Update  content 
    setContent(newContent);

     // If ws connection is open send updated content to the server

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'update-document', payload: { documentId, content: newContent } }));
    }
  };

  return (
    <Router>
      <div className="app-container">
        <header>
          <h1>Collaborative Document Editor</h1>
        </header>

        <main>
          <Routes>
            <Route
              path="/"
              element={
                documentId ? (
                  <Navigate to={`/document/${documentId}`} />
                ) : (
                  <button onClick={handleCreateDocument}>Create Document</button>
                )
              }
            />
            <Route
              path="/document/:documentId"
              element={
                documentId ? (
                  <>
                    <h2>Document ID: {documentId}</h2>
                    <textarea
                      value={content}
                      onChange={(e) => handleUpdateDocument(e.target.value)}
                      placeholder="Start typing..."
                    />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </main>

        <footer>
          <p>Collaborative Document Editor - © 2024</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;