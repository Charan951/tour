import React, { useState, useEffect } from 'react';
import { ShoppingBag, Phone, Mail, Calendar, CreditCard, DollarSign, CheckCircle, Clock, Trash2, Edit, AlertCircle, RefreshCw, Eye, Wallet, RotateCcw } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { AdminLayout } from '../components/AdminLayout';
import toast from 'react-hot-toast';

const getFormattedDateTime = (item: any): { dateStr: string; timeStr: string; fullStr: string } => {
  let dateObj: Date | null = null;
  if (item?.createdAt) {
    dateObj = new Date(item.createdAt);
  } else if (item?.timestamp) {
    dateObj = new Date(item.timestamp);
  } else if (item?.date) {
    dateObj = new Date(item.date);
  } else if (item?._id && typeof item._id === 'string' && item._id.length === 24) {
    const timestamp = parseInt(item._id.substring(0, 8), 16) * 1000;
    if (!isNaN(timestamp)) {
      dateObj = new Date(timestamp);
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return {
    dateStr,
    timeStr,
    fullStr: `${dateStr} • ${timeStr}`
  };
};

const PAYMENT_STATUS_RANK: Record<string, number> = {
  'Pending Advance': 1,
  'Advance Paid': 2,
  'Full Paid': 3,
  'Refunded': 4
};

export const BookingsManagerPage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editBooking, setEditBooking] = useState<any>(null);

  // Edit form states
  const [editStatus, setEditStatus] = useState('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState('Pending Advance');
  const [editTotalPrice, setEditTotalPrice] = useState<number>(0);
  const [editAdvanceAmount, setEditAdvanceAmount] = useState<number>(0);
  const [editAdvancePaid, setEditAdvancePaid] = useState<boolean>(false);
  const [editPaymentMethod, setEditPaymentMethod] = useState('UPI / Online');
  const [editTransactionId, setEditTransactionId] = useState('');
  const [editSpecialRequests, setEditSpecialRequests] = useState('');



  useEffect(() => {
    fetchBookings();
    const handleDataUpdate = () => fetchBookings();
    window.addEventListener('hc_data_updated', handleDataUpdate);
    const interval = setInterval(fetchBookings, 10000);
    return () => {
      window.removeEventListener('hc_data_updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/admin/bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (b: any) => {
    setEditBooking(b);
    setEditStatus(b.status || 'Pending');
    setEditPaymentStatus(b.paymentStatus || 'Pending Advance');
    setEditTotalPrice(b.totalPrice || 0);
    setEditAdvanceAmount(b.advanceAmount || 0);
    setEditAdvancePaid(b.advancePaid || false);
    setEditPaymentMethod(b.paymentMethod || 'UPI / Online');
    setEditTransactionId(b.transactionId || '');
    setEditSpecialRequests(b.specialRequests || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBooking) return;

    const origStatus = editBooking.paymentStatus || 'Pending Advance';
    const currRank = PAYMENT_STATUS_RANK[origStatus] || 1;
    const newRank = PAYMENT_STATUS_RANK[editPaymentStatus] || 1;

    if (newRank < currRank) {
      toast.error(`Cannot revert payment status backwards from "${origStatus}" to "${editPaymentStatus}"`);
      return;
    }

    try {
      const payload = {
        status: editStatus,
        paymentStatus: editPaymentStatus,
        totalPrice: Number(editTotalPrice),
        advanceAmount: Number(editAdvanceAmount),
        advancePaid: editAdvancePaid,
        paymentMethod: editPaymentMethod,
        transactionId: editTransactionId,
        specialRequests: editSpecialRequests
      };

      await apiClient.patch(`/admin/bookings/${editBooking._id}`, payload);
      toast.success('Booking & advance details updated successfully');
      setEditBooking(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update booking');
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/admin/bookings/${id}`, { status: newStatus });
      toast.success(`Booking status changed to ${newStatus}`);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleQuickPaymentStatusChange = async (id: string, newPaymentStatus: string) => {
    const targetBooking = bookings.find((b) => String(b._id) === String(id));
    const currentStatus = targetBooking?.paymentStatus || 'Pending Advance';
    const currRank = PAYMENT_STATUS_RANK[currentStatus] || 1;
    const newRank = PAYMENT_STATUS_RANK[newPaymentStatus] || 1;

    if (newRank < currRank) {
      toast.error(`Cannot revert payment status backwards from "${currentStatus}" to "${newPaymentStatus}"`);
      return;
    }

    try {
      const payload: any = { paymentStatus: newPaymentStatus };
      if (newPaymentStatus === 'Full Paid') {
        payload.remainingBalance = 0;
        payload.advancePaid = true;
      } else if (newPaymentStatus === 'Advance Paid') {
        payload.advancePaid = true;
      }
      await apiClient.patch(`/admin/bookings/${id}`, payload);
      toast.success(`Payment status updated to ${newPaymentStatus}`);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update payment status');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking record?')) return;
    const targetId = String(id);
    try {
      setBookings((prev) => prev.filter((b) => String(b._id) !== targetId));
      await apiClient.delete(`/admin/bookings/${targetId}`);
      toast.success('Booking deleted');
      if (selectedBooking && String(selectedBooking._id) === targetId) setSelectedBooking(null);
    } catch (err) {
      toast.error('Failed to delete booking');
    } finally {
      fetchBookings();
    }
  };

  // Filtered list
  const filteredBookings = bookings.filter((b) => {
    const matchesTab =
      activeTab === 'All'
        ? true
        : activeTab === 'Packages'
        ? b.bookingType === 'package' || !b.bookingType
        : activeTab === 'Activities'
        ? b.bookingType === 'activity'
        : activeTab === 'Pending Advance'
        ? b.paymentStatus === 'Pending Advance' || !b.advancePaid
        : activeTab === 'Advance Paid'
        ? b.advancePaid || b.paymentStatus === 'Advance Paid'
        : activeTab === 'Confirmed'
        ? b.status === 'Confirmed'
        : activeTab === 'Completed'
        ? b.status === 'Completed'
        : true;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (b.customerName || '').toLowerCase().includes(q) ||
      (b.email || '').toLowerCase().includes(q) ||
      (b.mobile || '').toLowerCase().includes(q) ||
      (b.bookingId || '').toLowerCase().includes(q) ||
      (b.packageName || '').toLowerCase().includes(q) ||
      (b.activityName || '').toLowerCase().includes(q) ||
      (b.activityCode || '').toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  // Calculate Metrics
  const totalBookingsCount = bookings.length;
  const totalAdvanceCollected = bookings.reduce(
    (sum, b) => {
      const isFull = b.paymentStatus === 'Full Paid' || Number(b.remainingBalance || 0) === 0;
      if (isFull) return sum + Number(b.totalPrice || 0);
      const isAdv = b.advancePaid || b.paymentStatus === 'Advance Paid';
      return sum + (isAdv ? Number(b.advanceAmount || 0) : 0);
    },
    0
  );
  const totalRemainingPending = bookings.reduce(
    (sum, b) => {
      const isFull = b.paymentStatus === 'Full Paid' || Number(b.remainingBalance || 0) === 0;
      return sum + (isFull ? 0 : Number(b.remainingBalance || 0));
    },
    0
  );
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;

  return (
    <AdminLayout
      title="Package Bookings & Advance Payments"
      subtitle="Manage customer package bookings, add/update advance payment amounts, track payment reference IDs, and confirm orders."
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Bookings</span>
              <span className="font-['Outfit'] font-bold text-3xl text-slate-900 mt-1 block">{totalBookingsCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Advance Collected</span>
              <span className="font-['Outfit'] font-bold text-3xl text-emerald-600 mt-1 block">₹{totalAdvanceCollected.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Remaining Balance</span>
              <span className="font-['Outfit'] font-bold text-3xl text-amber-600 mt-1 block">₹{totalRemainingPending.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Confirmed Orders</span>
              <span className="font-['Outfit'] font-bold text-3xl text-ocean-600 mt-1 block">{confirmedCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Header Controls & Filter Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['All', 'Packages', 'Activities', 'Pending Advance', 'Advance Paid', 'Confirmed', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-ocean-600 text-white shadow-xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, customer, phone, package..."
                className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-ocean-600"
              />
              <button
                onClick={() => fetchBookings()}
                className="p-2 rounded-xl bg-slate-100 hover:bg-ocean-600 hover:text-white text-slate-600 transition-all cursor-pointer shrink-0"
                title="Refresh Bookings"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading package bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80">
            No package bookings found for the selected filter.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Customer Info</th>
                    <th className="p-4">Package & Travel</th>
                    <th className="p-4">Advance & Price</th>
                    <th className="p-4">Order Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredBookings.map((b) => {
                    const isAdvPaid = b.advancePaid || b.paymentStatus === 'Advance Paid' || b.paymentStatus === 'Full Paid';
                    const { dateStr, timeStr } = getFormattedDateTime(b);
                    return (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-ocean-600 text-sm">{b.bookingId}</div>
                          <div className="flex items-center gap-1 mt-1 text-[11px]">
                            <Clock className="w-3 h-3 text-ocean-600 shrink-0" />
                            <span className="font-bold text-slate-800">{timeStr}</span>
                            <span className="text-slate-400 font-medium">({dateStr})</span>
                          </div>
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="font-bold text-slate-900 text-sm">{b.customerName}</div>
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Phone className="w-3.5 h-3.5 text-ocean-600" /> {b.mobile}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail className="w-3.5 h-3.5" /> {b.email}
                          </div>
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {b.bookingType === 'activity' ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px] flex items-center gap-1">
                                ⚡ Activity
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-ocean-800 font-extrabold text-[10px] flex items-center gap-1">
                                📦 Package
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-800 line-clamp-1">
                            {b.activityName || b.packageName}
                          </div>
                          <div className="text-slate-500">
                            📅 {b.travelDate ? new Date(b.travelDate).toLocaleDateString() : 'TBD'} ({b.adults || 1} Adults, {b.children || 0} Kids)
                          </div>
                          {b.pricingTier && b.bookingType !== 'activity' && (
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold text-[10px]">
                              {b.pricingTier} Tier
                            </span>
                          )}
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="font-bold text-slate-900">Total: ₹{Number(b.totalPrice || 0).toLocaleString()}</div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(() => {
                              const currentStatusVal = b.paymentStatus || (isAdvPaid ? 'Advance Paid' : 'Pending Advance');
                              const currentRank = PAYMENT_STATUS_RANK[currentStatusVal] || 1;
                              return (
                                <select
                                  value={currentStatusVal}
                                  onChange={(e) => handleQuickPaymentStatusChange(b._id, e.target.value)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border outline-none cursor-pointer ${
                                    currentStatusVal === 'Full Paid' || Number(b.remainingBalance || 0) === 0
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                      : isAdvPaid
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-amber-100 border-amber-200 text-amber-800'
                                  }`}
                                >
                                  <option value="Pending Advance" disabled={currentRank > 1}>🟡 Pending Advance</option>
                                  <option value="Advance Paid" disabled={currentRank > 2}>🟢 Advance Paid</option>
                                  <option value="Full Paid" disabled={currentRank > 3}>🎉 Full Paid</option>
                                </select>
                              );
                            })()}
                          </div>
                          <div className={`text-[11px] font-bold ${
                            Number(b.remainingBalance || 0) === 0 || b.paymentStatus === 'Full Paid'
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}>
                            {Number(b.remainingBalance || 0) === 0 || b.paymentStatus === 'Full Paid'
                              ? '✅ Remaining Paid (Balance: ₹0)'
                              : `Balance Due: ₹${Number(b.remainingBalance || 0).toLocaleString()}`}
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={b.status || 'Pending'}
                            onChange={(e) => handleQuickStatusChange(b._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                              b.status === 'Confirmed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : b.status === 'Completed'
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : b.status === 'Cancelled'
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <option value="Pending">🟡 Pending</option>
                            <option value="Confirmed">🟢 Confirmed</option>
                            <option value="Completed">🎉 Completed</option>
                            <option value="Cancelled">🔴 Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 rounded-xl bg-blue-50 text-ocean-600 hover:bg-ocean-600 hover:text-white transition-all"
                            title="View Full Booking Info"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                            title="Edit Advance & Order Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(b._id)}
                            className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Booking & Advance Full Screen Modal */}
      {editBooking && (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col w-full h-full min-h-screen">
          {/* Top Full-Width Header Bar */}
          <div className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-6 sm:px-10 py-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Outfit'] font-bold text-lg sm:text-xl text-slate-900">
                  Manage Booking ({editBooking.bookingId})
                </h3>
                <p className="text-xs text-slate-500">Update advance amount, payment status, and customer details</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditBooking(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              ✕ Close Window
            </button>
          </div>

          {/* Full Screen Body Content */}
          <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 text-xs text-slate-800">

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Total Price (₹)</label>
                  <input
                    type="number"
                    value={editTotalPrice}
                    onChange={(e) => setEditTotalPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 outline-none text-slate-900 font-bold focus:border-ocean-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Advance Amount (₹)</label>
                  <input
                    type="number"
                    value={editAdvanceAmount}
                    onChange={(e) => setEditAdvanceAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 outline-none text-slate-900 font-bold focus:border-ocean-600"
                  />
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditAdvanceAmount(Math.round(editTotalPrice * 0.25))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      25% (₹{Math.round(editTotalPrice * 0.25).toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditAdvanceAmount(Math.round(editTotalPrice * 0.30))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      30% (₹{Math.round(editTotalPrice * 0.30).toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditAdvanceAmount(Math.round(editTotalPrice * 0.50))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      50% (₹{Math.round(editTotalPrice * 0.50).toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditAdvanceAmount(editTotalPrice)}
                      className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800"
                    >
                      100% Full Payment
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <input
                    type="checkbox"
                    id="editAdvancePaid"
                    checked={editAdvancePaid}
                    onChange={(e) => {
                      setEditAdvancePaid(e.target.checked);
                      if (e.target.checked && editPaymentStatus === 'Pending Advance') {
                        setEditPaymentStatus('Advance Paid');
                      }
                    }}
                    className="w-4 h-4 text-ocean-600 rounded cursor-pointer"
                  />
                  <label htmlFor="editAdvancePaid" className="text-slate-800 font-bold cursor-pointer">
                    Advance Payment Received
                  </label>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Payment Status</label>
                  {(() => {
                    const origStatusVal = editBooking?.paymentStatus || 'Pending Advance';
                    const origRank = PAYMENT_STATUS_RANK[origStatusVal] || 1;
                    return (
                      <select
                        value={editPaymentStatus}
                        onChange={(e) => {
                          const targetVal = e.target.value;
                          const targetRank = PAYMENT_STATUS_RANK[targetVal] || 1;
                          if (targetRank < origRank) {
                            toast.error(`Cannot revert payment status backwards from "${origStatusVal}" to "${targetVal}"`);
                            return;
                          }
                          setEditPaymentStatus(targetVal);
                          if (targetVal === 'Advance Paid' || targetVal === 'Full Paid') {
                            setEditAdvancePaid(true);
                          }
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold focus:border-ocean-600"
                      >
                        <option value="Pending Advance" disabled={origRank > 1}>🟡 Pending Advance</option>
                        <option value="Advance Paid" disabled={origRank > 2}>🟢 Advance Paid</option>
                        <option value="Full Paid" disabled={origRank > 3}>🎉 Full Paid</option>
                      </select>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Booking Order Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 font-bold focus:border-ocean-600"
                  >
                    <option value="Pending">🟡 Pending</option>
                    <option value="Confirmed">🟢 Confirmed</option>
                    <option value="Completed">🎉 Completed</option>
                    <option value="Cancelled">🔴 Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Payment Method</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                  >
                    <option value="UPI / Online">UPI / GPay / PhonePe</option>
                    <option value="Bank Transfer">Bank Transfer / IMPS</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Cash">Cash / Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Transaction Reference ID</label>
                <input
                  type="text"
                  value={editTransactionId}
                  onChange={(e) => setEditTransactionId(e.target.value)}
                  placeholder="e.g. UPI-REF-984729184"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Special Requests / Notes</label>
                <textarea
                  value={editSpecialRequests}
                  onChange={(e) => setEditSpecialRequests(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-900 focus:border-ocean-600"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-ocean-600 hover:bg-ocean-700 font-bold text-white shadow-md cursor-pointer">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditBooking(null)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* View Full Booking Details Full Screen Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col w-full h-full min-h-screen">
          {/* Top Full-Width Header Bar */}
          <div className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-6 sm:px-10 py-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Outfit'] font-bold text-lg sm:text-xl text-slate-900">
                  Booking Details ({selectedBooking.bookingId})
                </h3>
                <p className="text-xs text-slate-500">Created: {new Date(selectedBooking.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              ✕ Close Window
            </button>
          </div>

          {/* Full Screen Body Content */}
          <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 text-xs text-slate-800">

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${selectedBooking.bookingType === 'activity' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-ocean-800'}`}>
                    {selectedBooking.bookingType === 'activity' ? '⚡ Activity' : '📦 Package'}
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{selectedBooking.activityName || selectedBooking.packageName}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Customer: <strong>{selectedBooking.customerName}</strong></div>
                  <div>Phone: <strong>{selectedBooking.mobile}</strong></div>
                  <div>Email: <strong>{selectedBooking.email}</strong></div>
                  <div>Travel Date: <strong>{selectedBooking.travelDate ? new Date(selectedBooking.travelDate).toLocaleDateString() : 'TBD'}</strong></div>
                  <div>Travelers: <strong>{selectedBooking.adults} Adults, {selectedBooking.children || 0} Kids</strong></div>
                  <div>Tier: <strong>{selectedBooking.pricingTier || 'Standard'}</strong></div>
                </div>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total Package Price:</span>
                  <span>₹{Number(selectedBooking.totalPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Advance Payment Amount:</span>
                  <span>₹{Number(selectedBooking.advanceAmount || 0).toLocaleString()} ({selectedBooking.advancePaid ? 'Paid' : 'Pending'})</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold border-t border-blue-200/60 pt-1.5">
                  <span>Remaining Balance Due:</span>
                  <span>₹{Number(selectedBooking.remainingBalance || 0).toLocaleString()}</span>
                </div>
              </div>

              {selectedBooking.address && (selectedBooking.address.fullAddress || selectedBooking.address.city) && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Traveler Billing Address</span>
                  <span className="font-semibold text-slate-800">
                    {selectedBooking.address.fullAddress ||
                      [selectedBooking.address.street, selectedBooking.address.city, selectedBooking.address.state, selectedBooking.address.pincode].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {selectedBooking.paymentDetails && (selectedBooking.paymentDetails.upiId || selectedBooking.paymentDetails.cardLast4) && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-800 block font-semibold mb-0.5">User Payment Details</span>
                  {selectedBooking.paymentDetails.upiId && (
                    <div className="text-slate-800 font-mono">
                      UPI ID: <strong>{selectedBooking.paymentDetails.upiId}</strong>
                    </div>
                  )}
                  {selectedBooking.paymentDetails.cardLast4 && (
                    <div className="text-slate-800 font-mono">
                      Card: <strong>•••• •••• •••• {selectedBooking.paymentDetails.cardLast4}</strong> ({selectedBooking.paymentDetails.cardHolder || 'Cardholder'})
                    </div>
                  )}
                </div>
              )}

              {selectedBooking.transactionId && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Transaction Reference ID</span>
                  <span className="font-mono font-bold text-slate-800">{selectedBooking.transactionId} ({selectedBooking.paymentMethod})</span>
                </div>
              )}

              {selectedBooking.specialRequests && (
                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Customer Special Requests</span>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">{selectedBooking.specialRequests}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}


    </AdminLayout>
  );
};
