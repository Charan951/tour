/**
 * Socket.io Initialization & Debugging Utility
 * Provides robust socket connection management with fallback handling
 */

export const initializeSocketConnections = (io: any) => {
  console.log('🔌 Initializing Socket.io server...');

  io.on('connection', (socket: any) => {
    console.log(`✅ Client connected: ${socket.id} (${socket.handshake.address})`);
    
    // Track connection count
    const connectedClients = io.engine.clientsCount;
    console.log(`📊 Total connected clients: ${connectedClients}`);

    // Join updates room
    socket.on('join_updates', (data: any) => {
      const room = data?.room || 'general_updates';
      socket.join(room);
      console.log(`📡 Client ${socket.id} joined room: ${room}`);
      
      // Send acknowledgment to client
      socket.emit('joined_room', { room, status: 'success' });
    });

    // Listen for client heartbeat
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      const remainingClients = io.engine.clientsCount;
      console.log(`📊 Remaining connected clients: ${remainingClients}`);
    });

    // Error handling
    socket.on('error', (error: any) => {
      console.error(`⚠️ Socket error from ${socket.id}:`, error);
    });
  });

  // Monitor connection issues
  io.on('connect_error', (error: any) => {
    console.error('❌ Socket.io connection error:', error);
  });

  console.log('✅ Socket.io server initialized successfully');
  return io;
};

/**
 * Broadcast statistics (for debugging)
 */
export const broadcastStats = (io: any) => {
  setInterval(() => {
    const stats = {
      connectedClients: io.engine.clientsCount,
      timestamp: new Date().toISOString()
    };
    
    // Only log every 30 seconds if there are connections
    if (stats.connectedClients > 0) {
      console.log(`📊 Socket.io stats:`, stats);
    }
  }, 30000);
};
