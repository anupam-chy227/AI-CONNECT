let io = null;
function initSocket(ioInstance) { io = ioInstance; }
function publish(channel, payload) {
  if (!io) { console.warn('no io initialized - skipping publish'); return; }
  io.emit(channel, payload);
}
module.exports = { initSocket, publish };

