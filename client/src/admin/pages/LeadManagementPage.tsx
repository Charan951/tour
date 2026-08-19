import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, Calendar, MessageSquare, Plus, Trash2, Edit, CheckCircle, Clock, MapPin } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { AdminLayout } from '../components/AdminLayout';
import toast from 'react-hot-toast';
import { FALLBACK_ENQUIRIES } from '../../utils/mobileDataFallback';

export const LeadManagementPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Note state
  const [newNote, setNewNote] = useState('');

  // Lead Form State (Create / Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budget, setBudget] = useState('');
  const [travelType, setTravelType] = useState('Family');
  const [status, setStatus] = useState('New');
  const [priority, setPriority] = useState('Medium');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEnquiries();
    fetchOptions();
    const handleDataUpdate = () => fetchEnquiries();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(fetchEnquiries, 10000);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, []);

  const fetchOptions = async () => {
    try {
      const [destRes, pkgRes] = await Promise.all([
        apiClient.get('/destinations'),
        apiClient.get('/packages?limit=100')
      ]);
      setDestinations(destRes.data?.data || []);
      setPackages(pkgRes.data?.data || []);
    } catch (_) {}
  };

  const fetchEnquiries = async () => {
    try {
      const res = await apiClient.get('/admin/enquiries');
      const apiData = res.data.data || [];
      const map = new Map<string, any>();
      apiData.forEach((e: any) => map.set(e._id || e.enquiryId || e.id, e));
      FALLBACK_ENQUIRIES.forEach((e: any) => { if (!map.has(e._id)) map.set(e._id, e); });
      setEnquiries(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to fetch enquiries', err);
      setEnquiries(FALLBACK_ENQUIRIES);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFullName('');
    setEmail('');
    setMobile('');
    setDestinationId('');
    setPackageId('');
    setTravelDate('');
    setAdults(2);
    setChildren(0);
    setBudget('');
    setTravelType('Family');
    setStatus('New');
    setPriority('Medium');
    setMessage('');
  };

  const handleOpenEdit = (enq: any) => {
    setEditingId(enq._id);
    setFullName(enq.fullName || '');
    setEmail(enq.email || '');
    setMobile(enq.mobile || '');
    setDestinationId(typeof enq.destination === 'object' ? enq.destination?._id : enq.destination || '');
    setPackageId(typeof enq.package === 'object' ? enq.package?._id : enq.package || '');
    setTravelDate(enq.travelDate ? new Date(enq.travelDate).toISOString().split('T')[0] : '');
    setAdults(enq.adults || 2);
    setChildren(enq.children || 0);
    setBudget(enq.budget ? String(enq.budget) : '');
    setTravelType(enq.travelType || 'Family');
    setStatus(enq.status || 'New');
    setPriority(enq.priority || 'Medium');
    setMessage(enq.message || '');
    setIsEditModalOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !mobile) {
      toast.error('Customer name, email, and mobile are required');
      return;
    }

    try {
      const payload = {
        fullName,
        email,
        mobile,
        destination: destinationId || null,
        package: packageId || null,
        travelDate: travelDate || null,
        adults: Number(adults),
        children: Number(children),
        budget: budget ? Number(budget) : null,
        travelType,
        status,
        priority,
        message
      };

      if (editingId) {
        await apiClient.patch(`/admin/enquiries/${editingId}`, payload);
        toast.success('Lead updated successfully');
        setIsEditModalOpen(false);
      } else {
        await apiClient.post('/admin/enquiries', payload);
        toast.success('New lead created successfully');
        setIsCreateModalOpen(false);
      }

      resetForm();
      fetchEnquiries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save lead');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/admin/enquiries/${id}/status`, { status: newStatus });
      toast.success(`Lead status updated to ${newStatus}`);
      fetchEnquiries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update lead status');
    }
  };

  const handleAddNote = async (id: string) => {
    if (!newNote) return;
    try {
      const res = await apiClient.post(`/admin/enquiries/${id}/notes`, { note: newNote });
      toast.success('Note added');
      setNewNote('');
      if (res.data?.data) {
        setSelectedLead(res.data.data);
      }
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    const targetId = String(id);
    try {
      setEnquiries((prev) => prev.filter((e) => String(e._id) !== targetId));
      await apiClient.delete(`/admin/enquiries/${targetId}`);
      toast.success('Lead deleted');
      if (selectedLead && String(selectedLead._id) === targetId) setSelectedLead(null);
    } catch (err) {
      toast.error('Failed to delete lead');
    } finally {
      fetchEnquiries();
    }
  };

  return (
    <AdminLayout
      title="Lead CRM Management"
      subtitle="Track customer quotes, enquiry status, sales communication notes, and CRUD lead operations."
      action={
        <button
          onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] text-white font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Lead
        </button>
      }
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-700">Live Auto-Sync Active</span>
            <span className="text-xs text-slate-400">({enquiries.length} total leads)</span>
          </div>
          <button
            onClick={() => fetchEnquiries()}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0A6FB5] hover:text-white text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔄</span> Refresh Leads
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading customer leads...</div>
        ) : enquiries.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            No customer enquiries submitted yet. Click "+ Add New Lead" above to create one.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Travel Info</th>
                    <th className="p-4">Priority & Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {enquiries.map((enq) => (
                    <tr key={enq._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{enq.fullName}</div>
                        <div className="text-[11px] font-semibold mt-0.5">
                          {(() => {
                            const hasPkgObj = typeof enq.package === 'object' && enq.package !== null && enq.package.title;
                            const foundPkg = typeof enq.package === 'string' && enq.package ? packages.find(p => p._id === enq.package) : null;
                            const pkgTitle = hasPkgObj ? enq.package.title : (foundPkg?.title || enq.packageName);
                            if (pkgTitle) {
                              return <span className="text-[#0A6FB5]">📦 {pkgTitle}</span>;
                            }
                            return <span className="text-slate-600 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">🌐 General Trip Enquiry</span>;
                          })()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">ID: {enq.enquiryId || enq._id.substring(0, 8)}</div>
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
                        <div className="text-slate-400">{enq.adults || 1} Adults, {enq.children || 0} Kids</div>
                        {enq.budget && <div className="text-emerald-600 font-bold">Budget: ₹{Number(enq.budget).toLocaleString()}</div>}
                      </td>
                      <td className="p-4 space-y-1">
                        <select
                          value={enq.status || 'New'}
                          onChange={(e) => handleStatusChange(enq._id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 outline-none focus:border-[#0A6FB5] cursor-pointer"
                        >
                          <option value="New">🟢 New Lead</option>
                          <option value="Contacted">🟡 Contacted</option>
                          <option value="Qualified">🔵 Qualified</option>
                          <option value="Converted">🎉 Converted</option>
                          <option value="Closed Lost">🔴 Closed Lost</option>
                        </select>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedLead(enq)}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-[#0A6FB5] hover:bg-[#0A6FB5] hover:text-white font-bold transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEdit(enq)}
                          className="p-1.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                          title="Edit Lead Details"
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Create / Edit Lead Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 text-slate-800 space-y-4 my-8 border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">
                {editingId ? 'Edit Lead Details' : 'Create New Lead (Offline / Phone)'}
              </h3>
              <button onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Customer Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Mobile Number *</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ramesh@example.com"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Travel Date</label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Adults</label>
                  <input
                    type="number"
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    min={1}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Children</label>
                  <input
                    type="number"
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    min={0}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Budget (₹)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Destination</label>
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  >
                    <option value="">Select Destination (Optional)</option>
                    {destinations.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Package</label>
                  <select
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  >
                    <option value="">Select Package (Optional)</option>
                    {packages.map((p) => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Lead Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  >
                    <option value="New">🟢 New Lead</option>
                    <option value="Contacted">🟡 Contacted</option>
                    <option value="Qualified">🔵 Qualified</option>
                    <option value="Converted">🎉 Converted</option>
                    <option value="Closed Lost">🔴 Closed Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Customer Requirements / Note</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Enter details of customer enquiry..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-[#0A6FB5]"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#0A6FB5] hover:bg-[#085a94] font-bold text-white shadow-md cursor-pointer">
                  {editingId ? 'Update Lead Details' : 'Create Lead in Database'}
                </button>
                <button type="button" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail View Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl text-slate-800 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-['Outfit'] font-bold text-lg text-slate-900">Lead Details ({selectedLead.fullName})</h3>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Package & Destination Overview Card */}
              {(() => {
                const hasPkgObj = typeof selectedLead.package === 'object' && selectedLead.package !== null && selectedLead.package.title;
                const foundPkg = typeof selectedLead.package === 'string' && selectedLead.package ? packages.find(p => p._id === selectedLead.package) : null;
                const pkgName = hasPkgObj ? selectedLead.package.title : (foundPkg?.title || selectedLead.packageName || null);
                const pkgCode = hasPkgObj ? selectedLead.package.packageCode : (foundPkg?.packageCode || selectedLead.packageCode || null);
                
                const destName = typeof selectedLead.destination === 'object' && selectedLead.destination !== null
                  ? selectedLead.destination.name
                  : (destinations.find(d => d._id === selectedLead.destination)?.name || selectedLead.destinationName || selectedLead.preferredDestination || 'Flexible Destination');

                if (pkgName) {
                  let tier = 'Standard';
                  let estPrice = 'Custom Quote';
                  if (selectedLead.message && selectedLead.message.includes('[BOOKING REQUEST]')) {
                    const msg = selectedLead.message;
                    const tierM = msg.match(/Tier:\s*([^,]+)/);
                    const estM = msg.match(/Est:\s*([^.]+)/);
                    if (tierM) tier = tierM[1].trim();
                    if (estM) estPrice = estM[1].trim();
                  } else if (selectedLead.budget) {
                    estPrice = `₹${Number(selectedLead.budget).toLocaleString()}`;
                  }

                  return (
                    <div className="bg-gradient-to-r from-[#063B6D] to-[#0A6FB5] p-4.5 rounded-2xl text-white space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#57D0C9] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                          Requested Tour Package
                        </span>
                        {pkgCode && (
                          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-300/30">
                            {pkgCode}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-poppins font-black text-lg text-white leading-tight">
                          {pkgName}
                        </h4>
                        <p className="text-xs text-slate-200 flex items-center gap-1 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#57D0C9]" />
                          <span>Destination: <strong className="text-white font-bold">{destName}</strong></span>
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15 text-center text-xs">
                        <div className="bg-white/10 p-2 rounded-xl border border-white/15">
                          <span className="text-[10px] text-slate-300 block font-bold">Selected Class</span>
                          <span className="font-extrabold text-amber-300">{tier}</span>
                        </div>
                        <div className="bg-white/10 p-2 rounded-xl border border-white/15">
                          <span className="text-[10px] text-slate-300 block font-bold">Est. Total</span>
                          <span className="font-extrabold text-[#57D0C9] text-sm">{estPrice}</span>
                        </div>
                        <div className="bg-white/10 p-2 rounded-xl border border-white/15">
                          <span className="text-[10px] text-slate-300 block font-bold">Status</span>
                          <span className="font-extrabold text-emerald-300">{selectedLead.status || 'New'}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-gradient-to-r from-[#063B6D] via-[#0A6FB5] to-[#063B6D] p-4.5 rounded-2xl text-white space-y-2 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#57D0C9] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                        🌐 General Custom Trip Enquiry
                      </span>
                      <span className="text-xs font-bold text-[#57D0C9] bg-white/10 px-2 py-0.5 rounded-md border border-white/20">
                        Home Screen Lead
                      </span>
                    </div>

                    <div>
                      <h4 className="font-poppins font-black text-lg text-white leading-tight">
                        {destName && destName !== 'Flexible Destination' ? `Custom Trip Request (${destName})` : 'General Custom Trip Enquiry'}
                      </h4>
                      <p className="text-xs text-slate-200 flex items-center gap-1 mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#57D0C9]" />
                        <span>Preferred Destination: <strong className="text-white font-bold">{destName}</strong></span>
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold">Phone Number</span>
                  <span className="font-bold text-slate-900">{selectedLead.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Email Address</span>
                  <span className="font-bold text-slate-900">{selectedLead.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Travel Date / Month</span>
                  <span className="font-bold text-slate-900">{selectedLead.travelDate ? new Date(selectedLead.travelDate).toLocaleDateString() : 'Flexible'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Travelers Breakdown</span>
                  <span className="font-bold text-slate-900">{selectedLead.adults || 1} Adults, {selectedLead.children || 0} Kids</span>
                </div>
                {selectedLead.preferredDestination && (
                  <div className="col-span-2 border-t border-slate-200/60 pt-2">
                    <span className="text-slate-400 block font-semibold">Preferred Destination</span>
                    <span className="font-bold text-[#0A6FB5]">{selectedLead.preferredDestination}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Customer Message / Special Requirements</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">{selectedLead.message || 'No additional note provided.'}</p>
              </div>

              {/* Saved Communication Notes */}
              {selectedLead.notes && selectedLead.notes.length > 0 && (
                <div>
                  <span className="text-slate-400 block font-semibold mb-1.5">Communication Notes ({selectedLead.notes.length})</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {selectedLead.notes.map((n: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 flex justify-between items-center">
                        <span>{n.note}</span>
                        <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    className="px-4 py-2.5 rounded-xl bg-[#0A6FB5] text-white font-bold text-xs cursor-pointer"
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
