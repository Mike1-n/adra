import React, { useState, useMemo } from 'react';
import {
  Building2,
  ShoppingCart,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  PackageCheck,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export function InventorySuppliersView({
  suppliers = [],
  purchaseOrders = [],
  onOpenCreatePOModal,
  onOpenReceiveStockFromPO
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'directory'
  const [searchTerm, setSearchTerm] = useState('');
  const [poFilter, setPoFilter] = useState('ALL'); // 'ALL' | 'IN_TRANSIT' | 'PENDING' | 'RECEIVED'

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const q = searchTerm.toLowerCase();
      const matches =
        (po.po_number || '').toLowerCase().includes(q) ||
        (po.supplier_name || '').toLowerCase().includes(q) ||
        (po.items_summary || '').toLowerCase().includes(q) ||
        (po.warehouse_destination || '').toLowerCase().includes(q);

      if (!matches) return false;
      if (poFilter === 'IN_TRANSIT' && po.status !== 'In Transit') return false;
      if (poFilter === 'PENDING' && po.status !== 'Pending Delivery') return false;
      if (poFilter === 'RECEIVED' && !po.status.includes('Received')) return false;

      return true;
    });
  }, [purchaseOrders, searchTerm, poFilter]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = searchTerm.toLowerCase();
      return (
        (s.company_name || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.contact_person || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchTerm]);

  const poStats = useMemo(() => {
    const totalCount = purchaseOrders.length;
    const totalVal = purchaseOrders.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
    const inTransitCount = purchaseOrders.filter(p => p.status === 'In Transit').length;
    const pendingCount = purchaseOrders.filter(p => p.status === 'Pending Delivery').length;

    return { totalCount, totalVal, inTransitCount, pendingCount };
  }, [purchaseOrders]);

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Purchase Orders
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">{poStats.totalCount}</span>
              <span className="text-xs font-semibold text-slate-500">POs</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">${poStats.totalVal.toLocaleString()} value</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 ml-2">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Inbound Orders
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-blue-900">{poStats.inTransitCount}</span>
              <span className="text-xs font-semibold text-blue-700">En Route</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-blue-600 block truncate">Arriving at depots</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 ml-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Pending Delivery
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-amber-900">{poStats.pendingCount}</span>
              <span className="text-xs font-semibold text-amber-700">Pending</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-600 block truncate">Supplier dispatch</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 ml-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Approved Vendors
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">{suppliers.length}</span>
              <span className="text-xs font-semibold text-slate-500">Suppliers</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Vetted partners</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 ml-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 2. SUB-TAB BAR & CONTROLS */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Sub-tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-teal-600" />
              <span>Purchase Orders</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'directory'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Approved Suppliers</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCreatePOModal}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'orders' ? 'Search PO #, supplier, items, or destination...' : 'Search supplier name, category, or contact...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900 transition"
            />
          </div>

          {activeTab === 'orders' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none shrink-0">
              <button
                type="button"
                onClick={() => setPoFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  poFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({purchaseOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setPoFilter('IN_TRANSIT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  poFilter === 'IN_TRANSIT' ? 'bg-blue-600 text-white shadow-2xs' : 'text-blue-800 hover:text-blue-950'
                }`}
              >
                In Transit ({poStats.inTransitCount})
              </button>
              <button
                type="button"
                onClick={() => setPoFilter('PENDING')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  poFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                Pending ({poStats.pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setPoFilter('RECEIVED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  poFilter === 'RECEIVED' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                Received
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. VIEW 1: PURCHASE ORDERS LIST */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {filteredPOs.length === 0 ? (
            <div className="py-10 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-4">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600 text-xs">No purchase orders found matching filters.</p>
            </div>
          ) : (
            filteredPOs.map(po => {
              const isReceived = po.status.includes('Received');
              const isInTransit = po.status === 'In Transit';

              return (
                <div
                  key={po.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4.5 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                        {po.po_number}
                      </span>
                      <span className="font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        {po.supplier_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isReceived
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isInTransit
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {po.status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                      {po.items_summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-slate-500">
                      <span>Dest: <strong className="text-slate-700">{po.warehouse_destination}</strong></span>
                      <span>•</span>
                      <span>Ordered: <strong>{po.order_date}</strong></span>
                      {po.expected_delivery && (
                        <>
                          <span>•</span>
                          <span>Expected: <strong>{po.expected_delivery}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Value & Receive Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">PO Value</span>
                      <span className="font-black text-sm sm:text-base text-slate-900 font-mono">
                        ${Number(po.total_amount).toLocaleString()}
                      </span>
                    </div>

                    {!isReceived && (
                      <button
                        type="button"
                        onClick={() => onOpenReceiveStockFromPO(po)}
                        className="px-3 py-1.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Receive GRN</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. VIEW 2: APPROVED SUPPLIERS DIRECTORY */}
      {activeTab === 'directory' && (
        filteredSuppliers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6">
            <Building2 className="w-9 h-9 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700 text-xs sm:text-sm">No Approved Suppliers Registered Yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Vendors will appear here as they are added or contracted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredSuppliers.map(s => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4.5 shadow-xs hover:border-slate-300 transition space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{s.company_name}</h4>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    {s.category}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-amber-800 text-xs font-extrabold shrink-0">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{s.rating ? Number(s.rating).toFixed(1) : '5.0'}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-medium truncate">{s.email}</span>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-medium">{s.phone}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600 text-[11px] truncate">{s.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  Fulfilled: <strong className="text-slate-800">{s.goods_supplied_count !== undefined ? s.goods_supplied_count : 0} shipments</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Vetted
                </span>
              </div>
            </div>
          ))}
        </div>
        )
      )}
    </div>
  );
}
