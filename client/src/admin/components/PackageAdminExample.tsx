/**
 * EXAMPLE: Real-Time Admin Component
 * Shows how to use useRealtimeUpdates hook in your admin components
 * 
 * Copy and adapt this pattern for your admin pages
 */

import { useEffect, useState, useCallback } from 'react';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { apiClient } from '../api/apiClient';
import toast from 'react-hot-toast';

interface Package {
  _id: string;
  title: string;
  destination: string;
  startingPrice: number;
  duration: { days: number; nights: number };
  featured: boolean;
  createdAt: string;
}

export const PackageAdminExample = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Setup real-time listeners
   * This hook automatically listens for package updates, creates, and deletions
   */
  const { isConnected, forceRefresh } = useRealtimeUpdates({
    onPackageUpdate: (updatedData) => {
      console.log('📡 Received real-time package update:', updatedData);

      if (updatedData?.deleted) {
        // A package was deleted
        setPackages((prev) => prev.filter((pkg) => pkg._id !== updatedData.id));
        toast.success('Package deleted by another admin');
      } else {
        // A package was created or updated
        setPackages((prev) => {
          const exists = prev.find((pkg) => pkg._id === updatedData._id);
          if (exists) {
            // Update existing package
            return prev.map((pkg) =>
              pkg._id === updatedData._id ? updatedData : pkg
            );
          } else {
            // Add new package
            return [...prev, updatedData];
          }
        });

        toast.success('Package updated in real-time!');
      }
    },
  });

  // Fetch initial data
  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/packages', {
          params: { limit: 100 },
        });
        setPackages(response.data.data || []);
      } catch (error) {
        toast.error('Failed to fetch packages');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // Handle creating a new package
  const handleAddPackage = async (formData: any) => {
    try {
      const response = await apiClient.post('/packages', formData);
      // Real-time update will automatically add it to the UI
      // No need to manually add it!
      toast.success('Package created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create package');
    }
  };

  // Handle updating a package
  const handleUpdatePackage = async (id: string, formData: any) => {
    try {
      const response = await apiClient.put(`/packages/${id}`, formData);
      // Real-time update will automatically update it in the UI
      toast.success('Package updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update package');
    }
  };

  // Handle deleting a package
  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      await apiClient.delete(`/packages/${id}`);
      // Real-time update will automatically remove it from the UI
      toast.success('Package deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete package');
    }
  };

  return (
    <div className="p-6">
      {/* Connection Status Indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm font-medium">
          {isConnected ? '🟢 Connected to Real-Time Updates' : '🔴 Disconnected'}
        </span>
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Package Manager</h1>
        <button
          onClick={() => {
            // Open your add package modal/form
            const newPackage = {
              title: 'New Package',
              destination: 'DEST_ID',
              startingPrice: 50000,
              duration: { days: 5, nights: 4 },
            };
            handleAddPackage(newPackage);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Package
        </button>
      </div>

      {/* Packages Table */}
      {loading ? (
        <div className="text-center py-8">Loading packages...</div>
      ) : packages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No packages found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Title</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Featured</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg._id} className="hover:bg-gray-50 transition">
                  <td className="border border-gray-300 px-4 py-2">{pkg.title}</td>
                  <td className="border border-gray-300 px-4 py-2">₹{pkg.startingPrice.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {pkg.duration.days}D / {pkg.duration.nights}N
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {pkg.featured ? '✅' : '❌'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      onClick={() => {
                        handleUpdatePackage(pkg._id, { featured: !pkg.featured });
                      }}
                      className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-2">💡 How Real-Time Updates Work:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ When you create/update/delete a package, all admins see the change instantly</li>
          <li>✅ No need to refresh the page</li>
          <li>✅ Multiple tabs/windows auto-sync</li>
          <li>✅ WebSocket connection handles everything</li>
        </ul>
      </div>
    </div>
  );
};

export default PackageAdminExample;
