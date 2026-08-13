/**
 * INTEGRATION GUIDE: Real-Time Updates
 * 
 * This guide explains how to integrate real-time Socket.io updates into your existing controllers.
 * 
 * STEP 1: Import the socket event emitters
 * STEP 2: Call emitter functions after creating/updating/deleting data
 * STEP 3: Set up listeners on the client side
 */

// ============================================
// EXAMPLE 1: Package Controller Integration
// ============================================

// In your controllers/packageController.ts, add this import:
// import { emitCreate, emitUpdate, emitDelete } from '../config/socketEvents.js';

/*
Example controller function:

export const createPackage = async (req: Request, res: Response) => {
  try {
    const packageData = req.body;
    
    // Create the package in database
    const newPackage = await Package.create(packageData);
    
    // ✅ Emit real-time event to all connected clients
    emitCreate('Package', newPackage, 'general_updates');
    
    res.status(201).json({
      success: true,
      data: newPackage,
      message: 'Package created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Update in database
    const updatedPackage = await Package.findByIdAndUpdate(id, updateData, { new: true });
    
    // ✅ Emit real-time event
    emitUpdate('Package', updatedPackage, 'general_updates');
    
    res.status(200).json({
      success: true,
      data: updatedPackage,
      message: 'Package updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete from database
    await Package.findByIdAndDelete(id);
    
    // ✅ Emit real-time deletion event
    emitDelete('Package', id, 'general_updates');
    
    res.status(200).json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
*/

// ============================================
// EXAMPLE 2: Client Side Usage - React Component
// ============================================

/*
import { useEffect, useState } from 'react';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { apiClient } from '../api/apiClient';

export const PackageManager = () => {
  const [packages, setPackages] = useState([]);
  
  // ✅ Set up real-time listeners
  const { isConnected, forceRefresh } = useRealtimeUpdates({
    onPackageUpdate: (updatedData) => {
      if (updatedData?.deleted) {
        // Remove deleted package
        setPackages(prev => prev.filter(pkg => pkg._id !== updatedData.id));
      } else {
        // Add or update package
        setPackages(prev => {
          const exists = prev.find(pkg => pkg._id === updatedData._id);
          if (exists) {
            return prev.map(pkg => pkg._id === updatedData._id ? updatedData : pkg);
          }
          return [...prev, updatedData];
        });
      }
    }
  });
  
  useEffect(() => {
    // Fetch initial data
    const fetchPackages = async () => {
      const response = await apiClient.get('/packages');
      setPackages(response.data.data);
    };
    fetchPackages();
  }, []);
  
  const handleAddPackage = async (newPackage) => {
    await apiClient.post('/packages', newPackage);
    // Real-time update will automatically update the UI
  };
  
  const handleUpdatePackage = async (id, updatedData) => {
    await apiClient.put(`/packages/${id}`, updatedData);
    // Real-time update will automatically update the UI
  };
  
  const handleDeletePackage = async (id) => {
    await apiClient.delete(`/packages/${id}`);
    // Real-time update will automatically update the UI
  };
  
  return (
    <div>
      <p>Connection Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      {/* Your package UI here */}
    </div>
  );
};
*/

// ============================================
// EVENT TYPES & EMISSION PATTERNS
// ============================================

/*
Available emission functions:

1. emitCreate(entityType, data, room)
   - Call when creating new data
   - Event name: {entityType.toLowerCase()}:created

2. emitUpdate(entityType, data, room)
   - Call when updating existing data
   - Event name: {entityType.toLowerCase()}:updated

3. emitDelete(entityType, id, room)
   - Call when deleting data
   - Event name: {entityType.toLowerCase()}:deleted

4. emitToRoom(room, event, data)
   - Send custom event to specific room

5. broadcastToAll(event, data)
   - Send event to all connected clients

Supported entity types (automatically detected):
- package
- destination
- blog
- theme
- enquiry

For new entity types, add them to the patterns array in apiClient.ts
*/

// ============================================
// COMMON IMPLEMENTATION CHECKLIST
// ============================================

/*
☐ Step 1: Install socket.io and socket.io-client
   - Backend: npm install socket.io
   - Frontend: npm install socket.io-client

☐ Step 2: Update server/src/index.ts with WebSocket initialization
   - Already done in this update

☐ Step 3: Create socket event utility
   - Already created: server/src/config/socketEvents.ts

☐ Step 4: Create client-side hook
   - Already created: client/src/hooks/useRealtimeUpdates.ts

☐ Step 5: Update API client interceptors
   - Already done in apiClient.ts

☐ Step 6: Integrate emitters in all CRUD controllers
   - Add imports: import { emitCreate, emitUpdate, emitDelete } from '../config/socketEvents.js'
   - Call emitters after database operations

☐ Step 7: Use the hook in admin/UI components
   - Import: import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
   - Add listener callbacks
   - Update component state on events

☐ Step 8: Test end-to-end
   - Open admin panel in multiple tabs
   - Create/Update/Delete data
   - Verify all tabs update instantly without refresh
*/

export {};
