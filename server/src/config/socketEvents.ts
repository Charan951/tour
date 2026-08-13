/**
 * Socket.io Event Emitter Utility
 * Use these functions in your controllers to broadcast real-time updates to all connected clients
 */

export const emitDataUpdate = (eventType: string, data: any, room: string = 'general_updates') => {
  const io = (global as any).io;
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }

  io.to(room).emit('data_updated', {
    type: eventType,
    data: data,
    timestamp: new Date().toISOString(),
    event: `${eventType}:updated`
  });

  console.log(`📤 Emitted ${eventType} update to room: ${room}`);
};

/**
 * Emit create event for new data
 */
export const emitCreate = (entityType: string, data: any, room: string = 'general_updates') => {
  const io = (global as any).io;
  if (!io) return;

  io.to(room).emit(entityType.toLowerCase() + ':created', {
    type: entityType,
    data: data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit update event
 */
export const emitUpdate = (entityType: string, data: any, room: string = 'general_updates') => {
  const io = (global as any).io;
  if (!io) return;

  io.to(room).emit(entityType.toLowerCase() + ':updated', {
    type: entityType,
    data: data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit delete event
 */
export const emitDelete = (entityType: string, id: string, room: string = 'general_updates') => {
  const io = (global as any).io;
  if (!io) return;

  io.to(room).emit(entityType.toLowerCase() + ':deleted', {
    type: entityType,
    id: id,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit event to specific room
 */
export const emitToRoom = (room: string, event: string, data: any) => {
  const io = (global as any).io;
  if (!io) return;

  io.to(room).emit(event, {
    data: data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Broadcast to all clients (except sender)
 */
export const broadcastToAll = (event: string, data: any) => {
  const io = (global as any).io;
  if (!io) return;

  io.emit(event, {
    data: data,
    timestamp: new Date().toISOString(),
  });
};
