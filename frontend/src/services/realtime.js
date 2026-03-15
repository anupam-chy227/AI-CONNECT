// Frontend WebSocket client for realtime post events
import io from 'socket.io-client';

let socket = null;
const WS_URL = process.env.VITE_WS_URL || 'http://localhost:3001';

export function connectWebSocket(token) {
  if (socket?.connected) {
    console.log('[Realtime] WebSocket already connected');
    return;
  }

  console.log('[Realtime] Connecting to WebSocket server:', WS_URL);

  socket = io(WS_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[Realtime] WebSocket connected');
    dispatchEvent('websocket:connected', {});
  });

  socket.on('disconnect', (reason) => {
    console.log('[Realtime] WebSocket disconnected:', reason);
    dispatchEvent('websocket:disconnected', { reason });
  });

  socket.on('post.created', (data) => {
    console.log('[Realtime] Received post.created event:', data);
    dispatchEvent('post:created', { detail: data });
  });

  socket.on('post.updated', (data) => {
    console.log('[Realtime] Received post.updated event:', data);
    dispatchEvent('post:updated', { detail: data });
  });

  socket.on('post.deleted', (data) => {
    console.log('[Realtime] Received post.deleted event:', data);
    dispatchEvent('post:deleted', { detail: data });
  });

  socket.on('post.flagged', (data) => {
    console.log('[Realtime] Received post.flagged event (content review needed):', data);
    dispatchEvent('post:flagged', { detail: data });
  });

  socket.on('connect_error', (error) => {
    console.error('[Realtime] WebSocket connection error:', error.message);
    dispatchEvent('websocket:error', { detail: error });
  });

  socket.on('error', (error) => {
    console.error('[Realtime] WebSocket error:', error);
  });
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Realtime] WebSocket disconnected by client');
  }
}

export function getSocket() {
  return socket;
}

// Dispatch custom event to window for React component integration
function dispatchEvent(eventName, detail) {
  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
}

// Hook for React components
export function useRealtimeEvents(onPostCreated) {
  const handlePostCreated = (event) => {
    onPostCreated?.(event.detail);
  };

  React.useEffect(() => {
    window.addEventListener('post:created', handlePostCreated);
    return () => {
      window.removeEventListener('post:created', handlePostCreated);
    };
  }, [onPostCreated]);
}
