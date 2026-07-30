import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Phone, Mail, Calendar, MessageSquare, Plus, Trash2, Edit, CheckCircle, Clock } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { AdminLayout } from '../components/AdminLayout';
import toast from 'react-hot-toast';

export const LeadManagementPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/enquiries');
      setEnquiries(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch enquiries', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/admin/enquiries/${id}/status`, { status: newStatus });
      toast.success(`Lead status updated to ${newStatus}`);
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to update lead status');
    }
  };

  const handleAddNote = async (id: string) => {
    if (!newNote) return;
    try {
      await apiClient.post(`/admin/enquiries/${id}/notes`, { note: newNote });
      toast.success('Note added');
      setNewNote('');
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to soft-delete this lead?')) return;
    try {
      await apiClient.delete(`/admin/enquiries/${id}`);
      toast.success('Lead deleted');
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  return (
    <AdminLayout
      title="Lead CRM Management"
      subtitle="Track customer quotes, enquiry status, and sales communication notes."
    >
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading customer leads...</div>
        ) : enquiries.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            No customer enquiries submitted yet.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Travel Dates</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {enquiries.map((enq) => (
                    <tr key={enq._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{enq.fullName}</div>
                        <div className="text-[11px] text-slate-400">Code: {enq.enquiryCode || enq._id.substring(0, 8)}</div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Phone className="w-3.5 h-3.5 text-[#0A6FB5]" /> {enq.mobile}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {enq.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{enq.travelDate ? new Date(enq.travelDate).toLocaleDateString() : 'Flexible Dates'}</div>
                        <div className="text-slate-400">{enq.adults || 2} Adults, {enq.children || 0} Kids</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={enq.status || 'New'}
                          onChange={(e) => handleStatusChange(enq._id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 outline-none focus:border-[#0A6FB5]"
                        >
                          <option value="New">🟢 New Lead</option>
                          <option value="Contacted">🟡 Contacted</option>
                          <option value="Qualified">🔵 Qualified</option>
                          <option value="Converted">🎉 Converted</option>
                          <option value="Closed Lost">🔴 Closed Lost</option>
                        </select>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedLead(enq)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#0A6FB5] hover:bg-[#0A6FB5] hover:text-white font-bold transition-all"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteLead(enq._id)}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl text-slate-800 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">Lead Details ({selectedLead.fullName})</h3>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold">Phone Number</span>
                  <span className="font-bold text-slate-900">{selectedLead.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Email Address</span>
                  <span className="font-bold text-slate-900">{selectedLead.email}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Customer Message / Special Requirements</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">{selectedLead.message || 'No additional note provided.'}</p>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1.5">Add Communication Note</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. Sent quotation on WhatsApp, following up tomorrow"
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0A6FB5]"
                  />
                  <button
                    onClick={() => handleAddNote(selectedLead._id)}
                    className="px-4 py-2.5 rounded-xl bg-[#0A6FB5] text-white font-bold text-xs"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
