"use client";

import { useState, useEffect } from "react";
import { Product } from "@/constants/catalog";
import UploadBouquetForm from "./UploadBouquetForm";

interface ActiveSessionItem {
  id: number;
  name: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt?: string;
  isCurrentDevice: boolean;
}

interface UserRecord {
  id: number;
  name: string;
  phone_or_email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  points_balance: number;
  is_blocked: number | boolean;
  created_at: string;
}

// Helper to parse User-Agent into friendly Arabic device description
function formatDeviceAgent(ua?: string) {
  if (!ua) return { label: "جهاز غير معروف", icon: "fa-solid fa-laptop" };
  const lower = ua.toLowerCase();

  const isMobile = lower.includes("iphone") || lower.includes("ipad") || lower.includes("android") || lower.includes("mobile");

  let os = "جهاز كمبيوتر";
  if (lower.includes("iphone")) os = "آيفون (iPhone)";
  else if (lower.includes("ipad")) os = "آيباد (iPad)";
  else if (lower.includes("android")) os = "جوال أندرويد (Android)";
  else if (lower.includes("macintosh")) os = "ماك (Mac)";
  else if (lower.includes("windows")) os = "ويندوز (Windows)";

  let browser = "متصفح";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome")) browser = "Chrome";
  else if (lower.includes("safari")) browser = "Safari";
  else if (lower.includes("firefox")) browser = "Firefox";

  return {
    label: `${os} — ${browser}`,
    icon: isMobile ? "fa-solid fa-mobile-screen-button" : "fa-solid fa-laptop",
  };
}

export default function AdminDashboardTabs({ initialProducts }: { initialProducts: Product[] }) {
  const [activeTab, setActiveTab] = useState<"bouquets" | "sessions" | "users">("bouquets");

  // Sessions State
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      if (res.ok) setSessions(data.sessions || []);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") fetchSessions();
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  const handleRevokeSession = async (sessionId: string, userName: string) => {
    const res = await fetch(`/api/admin/sessions?sessionId=${sessionId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      showToast(`تم تسجيل خروج جهاز (${userName}) بنجاح ✓`);
      fetchSessions();
    }
  };

  const handleToggleBlockUser = async (user: UserRecord) => {
    const nextBlocked = !Boolean(user.is_blocked);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, isBlocked: nextBlocked }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      fetchUsers();
    } else {
      alert(data.error || "حدث خطأ");
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast("تم تحديث صلاحية الحساب بنجاح ✓");
      fetchUsers();
    } else {
      alert(data.error || "تعذر تغيير الصلاحية");
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.phone_or_email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="bg-white p-2 rounded-3xl border border-cream-300 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("bouquets")}
          className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "bouquets" ? "bg-espresso-900 text-gold-400 shadow-md" : "text-espresso-800 hover:bg-cream-100"
          }`}
        >
          <i className="fa-solid fa-spa" />
          <span>إدارة الباقات والأقسام</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "sessions" ? "bg-espresso-900 text-gold-400 shadow-md" : "text-espresso-800 hover:bg-cream-100"
          }`}
        >
          <i className="fa-solid fa-laptop-mobile" />
          <span>الجلسات النشطة والأجهزة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "users" ? "bg-espresso-900 text-gold-400 shadow-md" : "text-espresso-800 hover:bg-cream-100"
          }`}
        >
          <i className="fa-solid fa-user-shield" />
          <span>إدارة وحظر المستخدمين</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-60">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* TAB 1: Bouquets Manager */}
      {activeTab === "bouquets" && <UploadBouquetForm initialProducts={initialProducts} />}

      {/* TAB 2: Active Sessions Manager */}
      {activeTab === "sessions" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 pb-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
                <i className="fa-solid fa-tower-broadcast text-emerald-600" />
                <span>الأجهزة والجلسات المتصلة حالياً ({sessions.length})</span>
              </h2>
              <p className="text-xs text-espresso-800/70 mt-1">
                يمكنك مراقبة جميع الأجهزة المسجّل دخولها وإنهاء جلسة أي جهاز فوراً عن بُعد
              </p>
            </div>

            <button
              type="button"
              onClick={fetchSessions}
              className="bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 text-xs font-bold px-4 py-2.5 rounded-full transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className={`fa-solid fa-rotate ${loadingSessions ? "animate-spin" : ""}`} />
              <span>تحديث القائمة</span>
            </button>
          </div>

          {loadingSessions ? (
            <div className="py-12 text-center text-sm font-bold text-espresso-800/60">جاري فحص الجلسات النشطة في Redis...</div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-sm text-espresso-800/60">لا توجد جلسات نشطة حالياً.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((s) => {
                const device = formatDeviceAgent(s.userAgent);
                return (
                  <div
                    key={s.sessionId}
                    className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition ${
                      s.isCurrentDevice ? "bg-gold-100/40 border-gold-400" : "bg-cream-50 border-cream-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-espresso-900 text-gold-400 flex items-center justify-center text-lg shrink-0">
                          <i className={device.icon} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm sm:text-base text-espresso-900">{s.name}</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rosewarm-100 text-rosewarm-700">
                              {s.role}
                            </span>
                            {s.isCurrentDevice && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                جهازك الحالي
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-espresso-800/80 mt-0.5">{device.label}</p>
                          <p className="text-[11px] text-espresso-800/60 mt-0.5" dir="ltr">
                            IP: {s.ipAddress || "غير معروف"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-cream-200 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-espresso-800/60">
                        {s.createdAt ? `بدأ: ${new Date(s.createdAt).toLocaleString("ar-SA")}` : "جلسة نشطة"}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRevokeSession(s.sessionId, s.name)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="fa-solid fa-power-off" />
                        <span>تسجيل خروج الجهاز</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Users & Block Management */}
      {activeTab === "users" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
                <i className="fa-solid fa-user-lock text-rosewarm-600" />
                <span>إدارة الحسابات وحظر المستخدمين ({users.length})</span>
              </h2>
              <p className="text-xs text-espresso-800/70 mt-1">
                عند حظر أي مستخدم، يتم منعه من تسجيل الدخول وطرده فوراً من جميع الأجهزة المتصلة
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الجوال..."
                className="w-full rounded-full bg-cream-100 border border-cream-300 py-2 pr-9 pl-4 text-xs text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />
              <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-rosewarm-500 text-xs" />
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-sm font-bold text-espresso-800/60">جاري تحميل قائمة المستخدمين...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-cream-200 text-espresso-800/70">
                    <th className="py-3 px-3">المستخدم</th>
                    <th className="py-3 px-3">الجوال / البريد</th>
                    <th className="py-3 px-3">رصيد النقاط</th>
                    <th className="py-3 px-3">الصلاحية</th>
                    <th className="py-3 px-3">الحالة</th>
                    <th className="py-3 px-3 text-left">إجراء الحظر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200/70">
                  {filteredUsers.map((u) => {
                    const blocked = Boolean(u.is_blocked);
                    return (
                      <tr key={u.id} className={`transition ${blocked ? "bg-rose-50/60" : "hover:bg-cream-50"}`}>
                        <td className="py-3.5 px-3 font-bold text-espresso-900">{u.name}</td>
                        <td className="py-3.5 px-3 text-espresso-800" dir="ltr">
                          {u.phone_or_email}
                        </td>
                        <td className="py-3.5 px-3 font-extrabold text-rosewarm-600">{u.points_balance} نقطة</td>
                        <td className="py-3.5 px-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="rounded-xl bg-cream-100 border border-cream-300 px-2.5 py-1 text-xs font-bold text-espresso-900 cursor-pointer"
                          >
                            <option value="CUSTOMER">عميل (CUSTOMER)</option>
                            <option value="STAFF">موظف (STAFF)</option>
                            <option value="ADMIN">مدير (ADMIN)</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              blocked ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {blocked ? "محظور 🚫" : "نشط ✓"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-left">
                          <button
                            type="button"
                            onClick={() => handleToggleBlockUser(u)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              blocked
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white"
                            }`}
                          >
                            {blocked ? "فك الحظر" : "حظر الحساب"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
