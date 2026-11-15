"use client";

import { useState, useEffect, useCallback } from "react";

interface OrderItem {
  productId: number;
  title: string;
  categoryName?: string;
  price: number;
  quantity: number;
  packagingColor?: string;
  giftMessage?: string;
  imageUrl?: string;
}

interface OrderRecord {
  id: number;
  orderNumber: string;
  userId: number | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderSource: "CART" | "DIRECT_PRODUCT";
  items: OrderItem[];
  totalAmount: number;
  status: "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  registeredUserName: string | null;
}

const STATUS_META: Record<OrderRecord["status"], { label: string; badgeClass: string }> = {
  NEW: {
    label: "طلب جديد 🔔",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
  },
  CONFIRMED: {
    label: "قيد التجهيز / مؤكد 🌸",
    badgeClass: "bg-sky-100 text-sky-900 border-sky-300",
  },
  COMPLETED: {
    label: "تم التسليم ✓",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  CANCELLED: {
    label: "ملغي ✗",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: number, newStatus: OrderRecord["status"]) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: newStatus }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      showToast("تم تحديث حالة الطلب بنجاح ✓");
    }
  };

  const handleDeleteOrder = async (orderId: number, orderNumber: string) => {
    if (!confirm(`هل أنت متأكد من حذف الطلب #${orderNumber} من السجل؟`)) return;
    const res = await fetch(`/api/admin/orders?id=${orderId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast(`تم حذف الطلب #${orderNumber}`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.customerAddress.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const completedSalesTotal = orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-cream-300 shadow-2xs">
          <span className="text-xs text-espresso-800/70 block">إجمالي الطلبات</span>
          <strong className="text-2xl font-extrabold text-espresso-900 mt-1 block">{orders.length}</strong>
        </div>
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
          <span className="text-xs text-amber-900/80 block">طلبات جديدة بانتظار التأكيد</span>
          <strong className="text-2xl font-extrabold text-amber-800 mt-1 block">{orders.filter((o) => o.status === "NEW").length}</strong>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
          <span className="text-xs text-emerald-900/80 block">طلبات مكتملة</span>
          <strong className="text-2xl font-extrabold text-emerald-700 mt-1 block">
            {orders.filter((o) => o.status === "COMPLETED").length}
          </strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gold-400 shadow-2xs">
          <span className="text-xs text-espresso-800/70 block">قيمة الطلبات المسجلة</span>
          <strong className="text-2xl font-extrabold text-rosewarm-600 mt-1 block">
            {completedSalesTotal} <small className="text-xs">ر.س</small>
          </strong>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-60">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Main Orders List Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-200 pb-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
              <i className="fa-brands fa-whatsapp text-emerald-600 text-2xl" />
              <span>سجل طلبات واتساب ({filteredOrders.length})</span>
            </h2>
            <p className="text-xs text-espresso-800/70 mt-1">
              يتم حفظ كل طلب تلقائياً عند ضغط العميل على زر الطلب عبر واتساب مع تفاصيل الباقات والصور
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم الطلب #ZL أو اسم العميل..."
              className="rounded-full bg-cream-100 border border-cream-300 py-2 px-4 text-xs text-espresso-900 focus:border-rosewarm-500 focus:outline-none w-56"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full bg-cream-100 border border-cream-300 py-2 px-3.5 text-xs font-bold text-espresso-900 cursor-pointer"
            >
              <option value="ALL">كل الحالات</option>
              <option value="NEW">طلبات جديدة 🔔</option>
              <option value="CONFIRMED">قيد التجهيز 🌸</option>
              <option value="COMPLETED">تم التسليم ✓</option>
              <option value="CANCELLED">ملغية ✗</option>
            </select>
            <button
              type="button"
              onClick={fetchOrders}
              className="bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 text-xs font-bold px-3.5 py-2 rounded-full transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className={`fa-solid fa-rotate ${loading ? "animate-spin" : ""}`} />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm font-bold text-espresso-800/60">جاري تحميل سجل الطلبات...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-espresso-800/60">لا توجد طلبات مسجلة مطابقة للبحث.</div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const meta = STATUS_META[order.status] || STATUS_META.NEW;
              return (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl border border-cream-300 bg-cream-50/70 hover:bg-white transition space-y-4 shadow-2xs"
                >
                  {/* Order Top Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 pb-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        dir="ltr"
                        className="font-mono text-xs sm:text-sm font-extrabold bg-espresso-900 text-gold-400 px-3 py-1 rounded-xl"
                      >
                        #{order.orderNumber}
                      </span>

                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${meta.badgeClass}`}>{meta.label}</span>

                      <span className="text-[11px] bg-cream-200 text-espresso-800 font-bold px-2.5 py-0.5 rounded-full">
                        {order.orderSource === "CART" ? "طلب سلة مشتريات" : "طلب مباشر لباقة"}
                      </span>

                      <span className="text-xs text-espresso-800/60">{new Date(order.createdAt).toLocaleString("ar-SA")}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderRecord["status"])}
                        className="rounded-xl bg-white border border-cream-300 px-3 py-1.5 text-xs font-bold text-espresso-900 cursor-pointer"
                      >
                        <option value="NEW">طلب جديد 🔔</option>
                        <option value="CONFIRMED">قيد التجهيز 🌸</option>
                        <option value="COMPLETED">تم التسليم ✓</option>
                        <option value="CANCELLED">ملغي ✗</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                        className="w-8 h-8 rounded-xl bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                        title="حذف الطلب"
                      >
                        <i className="fa-solid fa-trash-can text-xs" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Info Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-cream-200">
                    <div>
                      <span className="text-espresso-800/60 block">اسم العميل:</span>
                      <strong className="text-espresso-900">
                        {order.customerName}
                        {order.registeredUserName && (
                          <span className="text-[10px] text-emerald-700 mr-1">(حساب مسجل: {order.registeredUserName})</span>
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="text-espresso-800/60 block">رقم الجوال / التواصل:</span>
                      <strong className="text-espresso-900" dir="ltr">
                        {order.customerPhone || "غير مرفق"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-espresso-800/60 block">العنوان / الاستلام:</span>
                      <strong className="text-espresso-900">{order.customerAddress || "يحدد عبر واتساب"}</strong>
                    </div>
                  </div>

                  {/* Ordered Bouquets List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-cream-200">
                        {item.imageUrl && (
                          <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-14 h-14 rounded-lg object-cover border border-cream-300"
                            />
                          </a>
                        )}
                        <div className="flex-1 min-w-0 text-xs">
                          <h4 className="font-bold text-espresso-900 truncate">{item.title}</h4>
                          <p className="text-espresso-800/75 mt-0.5">
                            الكمية: <strong>{item.quantity}</strong> × {item.price} ر.س
                            {item.packagingColor && ` | التغليف: ${item.packagingColor}`}
                          </p>
                          {item.giftMessage && (
                            <p className="text-[11px] text-rosewarm-600 font-semibold mt-0.5 truncate">
                              💌 الكرت: &ldquo;{item.giftMessage}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-cream-200 text-xs sm:text-sm">
                    <span className="text-espresso-800/70 font-semibold">
                      عدد المنتجات: {order.items.reduce((s, i) => s + (i.quantity || 1), 0)}
                    </span>
                    <div className="font-extrabold text-base text-rosewarm-600">الإجمالي: {order.totalAmount} ر.س</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
