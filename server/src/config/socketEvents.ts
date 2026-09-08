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

  const payload = {
    type: eventType,
    data: data,
    timestamp: new Date().toISOString(),
    event: `${eventType}:updated`
  };

  io.to(room).emit('data_updated', payload);
  io.emit('data_updated', payload);
  io.emit('hc_data_updated', payload);

  console.log(`📤 Emitted ${eventType} update to room: ${room}`);
};

/**
 * Emit create event for new data
 */
export const emitCreate = (entityType: string, data: any, room: string = 'general_updates') => {
  const io = (global as any).io;
  if (!io) return;

  const eventName = entityType.toLowerCase() + ':created';
  const payload = {
    type: entityType,
    data: data,
    timestamp: new Date().toISOString(),
  };

  io.to(room).emit(eventName, payload);
  io.emit(eventName, payload);
  io.emit('hc_data_updated', payload);
};

/**
 * Emit update event
 */
export const emitUpdate = (entityType: string, data: any, room: string = 'general_updates') => {
  const io = (global as any).io;
  if (!io) return;

  const eventName = entityType.toLowerCase() + ':updated';
  const payload = {
    type: entityType,
    data: data,
    timestamp: new Date().toISOString(),
  };

  io.to(room).emit(eventName, payload);
  io.emit(eventName, payload);
  io.emit('hc_data_updated', payload);
};

/**
 * Emit delete event
 */
export const emitDelete = (entityType: string, id: string, room: string = 'general_updates') => {
  const io = (global as any).io;
  if (!io) return;

  const eventName = entityType.toLowerCase() + ':deleted';
  const payload = {
    type: entityType,
    id: id,
    timestamp: new Date().toISOString(),
  };

  io.to(room).emit(eventName, payload);
  io.emit(eventName, payload);
  io.emit('hc_data_updated', payload);
};

/**
 * Emit event to specific room
 */
export const emitToRoom = (room: string, event: string, data: any) => {
  const io = (global as any).io;
  if (!io) return;

  const payload = {
    data: data,
    timestamp: new Date().toISOString(),
  };

  io.to(room).emit(event, payload);
  io.emit(event, payload);
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
