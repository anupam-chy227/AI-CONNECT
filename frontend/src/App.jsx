import { useState, useEffect } from 'react';
import { connectWebSocket, useRealtimeEvents, disconnectWebSocket } from './services/realtime.js';

function App() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('Disconnected');
  const [token] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZmZlODc5My1lMGU0LTQ2NzMtOWQ1YS04NWZkODNjM2Q0YWUiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNzczNDk3NzkyLCJleHAiOjE3NzM1ODQxOTJ9.TwWfvv1QW63RtQWQ7PMYe466b2sRz52kjViTTbBDXho'); // demo token

  useEffect(() => {
    connectWebSocket(token);
    return () => disconnectWebSocket();
  }, [token]);

  useRealtimeEvents((postData) => {
    setPosts(prev => [postData, ...prev]);
  });

  useEffect(() => {
    const handleConnected = () => setStatus('Connected');
    const handleDisconnected = () => setStatus('Disconnected');
    const handleError = () => setStatus('Error');

    window.addEventListener('websocket:connected', handleConnected);
    window.addEventListener('websocket:disconnected', handleDisconnected);
    window.addEventListener('websocket:error', handleError);

    return () => {
      window.removeEventListener('websocket:connected', handleConnected);
      window.removeEventListener('websocket:disconnected', handleDisconnected);
      window.removeEventListener('websocket:error', handleError);
    };
  }, []);

  return (
    <div style={{ padding: '20px', background: '#0f1724', color: '#e6eef8', minHeight: '100vh' }}>
      <h1>AIConnect Feed (Realtime Demo)</h1>
      <p>WS Status: <strong>{status}</strong></p>
      <div style={{ marginTop: '20px' }}>
        <h3>Posts:</h3>
        {posts.length === 0 ? (
          <p>No posts yet. Backend events will appear here live.</p>
        ) : (
          posts.map((post, i) => (
            <div key={i} style={{ padding: '10px', margin: '10px 0', background: '#1e293b', borderRadius: '8px' }}>
              <pre>{JSON.stringify(post, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;

