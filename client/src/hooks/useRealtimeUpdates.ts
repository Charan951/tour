import { useEffect, useRef, useCallback, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { clientCache } from '../utils/cache';

const getSocketURL = (): string => {
  const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  
  if (apiUrl) {
    // Remove /api/v1 from the URL
    return apiUrl.replace(/\/api\/v1\/?$/, '');
  }
  
  // Fallback to localhost
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketURL();

console.log('🔌 Socket URL configured:', SOCKET_URL);

let globalSocket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 10;

/**
 * Get or create global socket instance
 */
const getSocket = (): Socket => {
  if (!globalSocket) {
    console.log('🔗 Creating new Socket.io connection to:', SOCKET_URL);
    
    globalSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      upgrade: true
    });

    globalSocket.on('connect', () => {
      console.log('✅ Connected to real-time server (Socket ID:', globalSocket?.id, ')');
      connectionAttempts = 0;
      globalSocket?.emit('join_updates', { room: 'general_updates' });
    });

    globalSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from real-time server. Reason:', reason);
    });

    globalSocket.on('joined_room', (data) => {
      console.log('📡 Successfully joined room:', data.room);
    });

    globalSocket.on('connect_error', (error) => {
      connectionAttempts++;
      console.warn(`⚠️ Connection error (attempt ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}):`, error);
    });

    globalSocket.on('error', (error) => {
      console.error('🔴 Socket.io error:', error);
    });
  }
  return globalSocket;
};

interface UseRealtimeUpdatesOptions {
  onPackageUpdate?: (data: any) => void;
  onActivityUpdate?: (data: any) => void;
  onDestinationUpdate?: (data: any) => void;
  onBannerUpdate?: (data: any) => void;
  onBlogUpdate?: (data: any) => void;
  onThemeUpdate?: (data: any) => void;
  onEnquiryUpdate?: (data: any) => void;
  onBookingUpdate?: (data: any) => void;
  onNotificationUpdate?: (data: any) => void;
  onDataUpdate?: (type: string, data: any) => void;
  room?: string;
}

/**
 * Hook to listen to real-time updates
 * Usage:
 * const { isConnected } = useRealtimeUpdates({
 *   onPackageUpdate: (data) => console.log('Package updated:', data),
 *   onDestinationUpdate: (data) => console.log('Destination updated:', data),
 * });
 */
export const useRealtimeUpdates = (options: UseRealtimeUpdatesOptions = {}) => {
  const { 
    onPackageUpdate, 
    onActivityUpdate,
    onDestinationUpdate,
    onBannerUpdate,
    onBlogUpdate, 
    onThemeUpdate,
    onEnquiryUpdate,
    onBookingUpdate,
    onNotificationUpdate,
    onDataUpdate,
    room = 'general_updates' 
  } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep callbacks fresh in refs to avoid re-subscribing socket listeners on every render
  const callbacksRef = useRef({
    onPackageUpdate,
    onActivityUpdate,
    onDestinationUpdate,
    onBannerUpdate,
    onBlogUpdate,
    onThemeUpdate,
    onEnquiryUpdate,
    onBookingUpdate,
    onNotificationUpdate,
    onDataUpdate
  });

  useEffect(() => {
    callbacksRef.current = {
      onPackageUpdate,
      onActivityUpdate,
      onDestinationUpdate,
      onBannerUpdate,
      onBlogUpdate,
      onThemeUpdate,
      onEnquiryUpdate,
      onBookingUpdate,
      onNotificationUpdate,
      onDataUpdate
    };
  }, [onPackageUpdate, onActivityUpdate, onDestinationUpdate, onBannerUpdate, onBlogUpdate, onThemeUpdate, onEnquiryUpdate, onBookingUpdate, onNotificationUpdate, onDataUpdate]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Update connection status
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleConnectError = () => setIsConnected(false);

    // Initial state
    setIsConnected(socket.connected);

    // Listen to connection state
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Socket Event Handlers calling latest refs
    const notifyDataChanged = () => {
      clientCache.clear();
      window.dispatchEvent(new Event('hc_data_updated'));
    };

    const handleDataUpdated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onDataUpdate?.(payload.type, payload.data);
    };

    const handlePackageCreated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onPackageUpdate?.(payload.data);
    };
    const handlePackageUpdated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onPackageUpdate?.(payload.data);
    };
    const handlePackageDeleted = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onPackageUpdate?.({ id: payload.id, deleted: true });
    };

    const handleActivityCreated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onActivityUpdate?.(payload.data);
    };
    const handleActivityUpdated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onActivityUpdate?.(payload.data);
    };
    const handleActivityDeleted = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onActivityUpdate?.({ id: payload.id, deleted: true });
    };

    const handleDestinationCreated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onDestinationUpdate?.(payload.data);
    };
    const handleDestinationUpdated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onDestinationUpdate?.(payload.data);
    };
    const handleDestinationDeleted = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onDestinationUpdate?.({ id: payload.id, deleted: true });
    };

    const handleBlogCreated = (payload: any) => callbacksRef.current.onBlogUpdate?.(payload.data);
    const handleBlogUpdated = (payload: any) => callbacksRef.current.onBlogUpdate?.(payload.data);
    const handleBlogDeleted = (payload: any) => callbacksRef.current.onBlogUpdate?.({ id: payload.id, deleted: true });

    const handleThemeCreated = (payload: any) => callbacksRef.current.onThemeUpdate?.(payload.data);
    const handleThemeUpdated = (payload: any) => callbacksRef.current.onThemeUpdate?.(payload.data);
    const handleThemeDeleted = (payload: any) => callbacksRef.current.onThemeUpdate?.({ id: payload.id, deleted: true });

    const handleBannerCreated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onBannerUpdate?.(payload.data);
    };
    const handleBannerUpdated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onBannerUpdate?.(payload.data);
    };
    const handleBannerDeleted = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onBannerUpdate?.({ id: payload.id, deleted: true });
    };

    const handleEnquiryCreated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onEnquiryUpdate?.(payload.data);
    };
    const handleEnquiryUpdated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onEnquiryUpdate?.(payload.data);
    };
    const handleEnquiryDeleted = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onEnquiryUpdate?.({ id: payload.id, deleted: true });
    };

    const handleBookingCreated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onBookingUpdate?.(payload.data);
    };
    const handleBookingUpdated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onBookingUpdate?.(payload.data);
    };
    const handleBookingDeleted = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onBookingUpdate?.({ id: payload.id, deleted: true });
    };

    const handleNotificationCreated = (payload: any) => {
      notifyDataChanged();
      callbacksRef.current.onNotificationUpdate?.(payload);
    };

    socket.on('data_updated', handleDataUpdated);
    socket.on('notification_created', handleNotificationCreated);
    socket.on('notification_updated', handleNotificationCreated);
    socket.on('notification_deleted', handleNotificationCreated);

    socket.on('package:created', handlePackageCreated);
    socket.on('package:updated', handlePackageUpdated);
    socket.on('package:deleted', handlePackageDeleted);

    socket.on('activity:created', handleActivityCreated);
    socket.on('activity:updated', handleActivityUpdated);
    socket.on('activity:deleted', handleActivityDeleted);

    socket.on('destination:created', handleDestinationCreated);
    socket.on('destination:updated', handleDestinationUpdated);
    socket.on('destination:deleted', handleDestinationDeleted);

    socket.on('banner:created', handleBannerCreated);
    socket.on('banner:updated', handleBannerUpdated);
    socket.on('banner:deleted', handleBannerDeleted);

    socket.on('blog:created', handleBlogCreated);
    socket.on('blog:updated', handleBlogUpdated);
    socket.on('blog:deleted', handleBlogDeleted);

    socket.on('theme:created', handleThemeCreated);
    socket.on('theme:updated', handleThemeUpdated);
    socket.on('theme:deleted', handleThemeDeleted);

    socket.on('enquiry:created', handleEnquiryCreated);
    socket.on('enquiry:updated', handleEnquiryUpdated);
    socket.on('enquiry:deleted', handleEnquiryDeleted);

    socket.on('booking:created', handleBookingCreated);
    socket.on('booking:updated', handleBookingUpdated);
    socket.on('booking:deleted', handleBookingDeleted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      socket.off('data_updated', handleDataUpdated);
      socket.off('notification_created', handleNotificationCreated);
      socket.off('notification_updated', handleNotificationCreated);
      socket.off('notification_deleted', handleNotificationCreated);

      socket.off('package:created', handlePackageCreated);
      socket.off('package:updated', handlePackageUpdated);
      socket.off('package:deleted', handlePackageDeleted);

      socket.off('activity:created', handleActivityCreated);
      socket.off('activity:updated', handleActivityUpdated);
      socket.off('activity:deleted', handleActivityDeleted);

      socket.off('destination:created', handleDestinationCreated);
      socket.off('destination:updated', handleDestinationUpdated);
      socket.off('destination:deleted', handleDestinationDeleted);

      socket.off('blog:created', handleBlogCreated);
      socket.off('blog:updated', handleBlogUpdated);
      socket.off('blog:deleted', handleBlogDeleted);

      socket.off('theme:created', handleThemeCreated);
      socket.off('theme:updated', handleThemeUpdated);
      socket.off('theme:deleted', handleThemeDeleted);

      socket.off('enquiry:created', handleEnquiryCreated);
      socket.off('enquiry:updated', handleEnquiryUpdated);
      socket.off('enquiry:deleted', handleEnquiryDeleted);

      socket.off('booking:created', handleBookingCreated);
      socket.off('booking:updated', handleBookingUpdated);
      socket.off('booking:deleted', handleBookingDeleted);
    };
  }, [room]);

  const forceRefresh = useCallback((entityType: string) => {
    window.dispatchEvent(new CustomEvent('realtime:refresh', { detail: { entityType } }));
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    forceRefresh
  };
};

/**
 * Disconnect the global socket (useful for logout)
 */
export const disconnectSocket = () => {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
};

/**
 * Connect/reconnect the socket
 */
export const reconnectSocket = () => {
  if (globalSocket) {
    globalSocket.connect();
  }
};
