"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditLogRecord {
  id: number;
  userId: number | null;
  userName: string;
  actionType: string;
  description: string;
  ipAddress: string;
  createdAt: string;
}

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  PRODUCT_ADD: { icon: "fa-solid fa-circle-plus", color: "bg-emerald-100 text-emerald-800" },
  PRODUCT_EDIT: { icon: "fa-solid fa-pen-to-square", color: "bg-gold-100 text-espresso-900" },
  PRODUCT_DELETE: { icon: "fa-solid fa-trash-can", color: "bg-rose-100 text-rose-700" },
  ORDER_STATUS: { icon: "fa-brands fa-whatsapp", color: "bg-sky-100 text-sky-900" },
  USER_BLOCK: { icon: "fa-solid fa-user-lock", color: "bg-rose-100 text-rose-800" },
  POINTS_ADJUST: { icon: "fa-solid fa-coins", color: "bg-amber-100 text-amber-900" },
  QR_GENERATE: { icon: "fa-solid fa-qrcode", color: "bg-purple-100 text-purple-900" },
  DEFAULT: { icon: "fa-solid fa-clock-rotate-left", color: "bg-cream-200 text-espresso-900" },
};

export default function LogsManager() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchesType = typeFilter === "ALL" || log.actionType.includes(typeFilter);
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || log.description.toLowerCase().includes(q) || log.userName.toLowerCase().includes(q) || log.actionType.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div dir="rtl" className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-200 pb-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-rosewarm-600" />
            <span>سجل التحديثات والنشاطات ({filteredLogs.length})</span>
          </h2>
          <p className="text-xs text-espresso-800/70 mt-1">متابعة دقيقة لكل التعديلات والإضافات التي تتم في لوحة تحكم متجر زهرة لينا</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في السجل..."
            className="rounded-full bg-cream-100 border border-cream-300 py-2 px-4 text-xs text-espresso-900 focus:border-rosewarm-500 focus:outline-none w-52"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-full bg-cream-100 border border-cream-300 py-2 px-3.5 text-xs font-bold text-espresso-900 cursor-pointer"
          >
            <option value="ALL">كل الأنشطة</option>
            <option value="PRODUCT">الباقات</option>
            <option value="ORDER">الطلبات</option>
            <option value="USER">المستخدمين</option>
            <option value="POINTS">النقاط</option>
            <option value="QR">أكواد QR</option>
          </select>
          <button
            type="button"
            onClick={fetchLogs}
            className="bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 text-xs font-bold px-3.5 py-2 rounded-full transition flex items-center gap-1.5 cursor-pointer"
          >
            <i className={`fa-solid fa-rotate ${loading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm font-bold text-espresso-800/60">جاري تحميل سجل النشاطات والتحديثات...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-12 text-center text-sm text-espresso-800/60">لا توجد سجلات مطابقة للبحث حالياً.</div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto p-1">
          {filteredLogs.map((log) => {
            const meta = ACTION_ICONS[log.actionType] || ACTION_ICONS.DEFAULT;
            return (
              <div
                key={log.id}
                className="p-4 rounded-2xl border border-cream-300 bg-cream-50/70 hover:bg-white transition flex items-start gap-3.5 shadow-2xs"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 ${meta.color}`}>
                  <i className={meta.icon} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-espresso-900">{log.userName}</span>
                      <span className="text-[10px] font-mono bg-espresso-900 text-gold-400 px-2 py-0.5 rounded-md">{log.actionType}</span>
                    </div>

                    <span className="text-[11px] text-espresso-800/60">{new Date(log.createdAt).toLocaleString("ar-SA")}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-espresso-800 leading-relaxed">{log.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
