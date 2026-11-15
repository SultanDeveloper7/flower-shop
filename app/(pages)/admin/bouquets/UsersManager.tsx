"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserRecord {
  id: number;
  name: string;
  phone_or_email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  points_balance: number;
  is_blocked: number | boolean;
  created_at?: string;
}

export default function UsersManager() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Manual Points Adjustment Modal State
  const [pointsModalUser, setPointsModalUser] = useState<UserRecord | null>(null);
  const [pointsOperation, setPointsOperation] = useState<"ADD" | "DEDUCT">("ADD");
  const [pointsAmount, setPointsAmount] = useState<number>(50);
  const [savingPoints, setSavingPoints] = useState(false);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "تعذر جلب قائمة المستخدمين");
      } else {
        setUsers(Array.isArray(data.users) ? data.users : []);
      }
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم لجلب المستخدمين");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleBlockUser = async (user: UserRecord) => {
    const nextBlocked = !Boolean(user.is_blocked);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, isBlocked: nextBlocked }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "تم تحديث حالة الحظر ✓");
        fetchUsers();
      } else {
        alert(data.error || "حدث خطأ أثناء تحديث الحظر");
      }
    } catch {
      alert("تعذر الاتصال بالخادم");
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
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
    } catch {
      alert("تعذر الاتصال بالخادم");
    }
  };

  const openPointsModal = (user: UserRecord) => {
    setPointsModalUser(user);
    setPointsOperation("ADD");
    setPointsAmount(50);
  };

  const handleConfirmPointsAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsModalUser || pointsAmount <= 0) return;

    setSavingPoints(true);
    const delta = pointsOperation === "ADD" ? Number(pointsAmount) : -Number(pointsAmount);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pointsModalUser.id,
          pointsDelta: delta,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "تم تعديل النقاط بنجاح ✓");
        setPointsModalUser(null);
        fetchUsers();
      } else {
        alert(data.error || "تعذر تحديث النقاط");
      }
    } finally {
      setSavingPoints(false);
    }
  };

  // Null-safe filtering so null names/phones never crash the page
  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    const nameStr = String(u.name || "").toLowerCase();
    const contactStr = String(u.phone_or_email || "").toLowerCase();
    return nameStr.includes(q) || contactStr.includes(q);
  });

  const previewBalance = pointsModalUser
    ? Math.max(
        0,
        Number(pointsModalUser.points_balance || 0) + (pointsOperation === "ADD" ? Number(pointsAmount || 0) : -Number(pointsAmount || 0)),
      )
    : 0;

  return (
    <div dir="rtl" className="space-y-6">
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={fetchUsers} className="underline text-xs cursor-pointer">
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-6">
        {/* Header + Search + Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
              <i className="fa-solid fa-user-lock text-rosewarm-600" />
              <span>إدارة الحسابات، النقاط، وحظر المستخدمين ({users.length})</span>
            </h2>
            <p className="text-xs text-espresso-800/70 mt-1">
              يمكنك إضافة أو خصم نقاط الولاء لأي عميل يدوياً، أو تغيير صلاحيته، أو حظره من الدخول
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الجوال..."
                className="w-full rounded-full bg-cream-100 border border-cream-300 py-2 pr-9 pl-4 text-xs text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />
              <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-rosewarm-500 text-xs" />
            </div>

            <button
              type="button"
              onClick={fetchUsers}
              className="bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 text-xs font-bold px-3.5 py-2 rounded-full transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="تحديث القائمة"
            >
              <i className={`fa-solid fa-rotate ${loadingUsers ? "animate-spin" : ""}`} />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loadingUsers ? (
          <div className="py-12 text-center text-sm font-bold text-espresso-800/60">جاري تحميل قائمة المستخدمين...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-sm text-espresso-800/60">لا يوجد مستخدمون مطابقون للبحث.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-cream-200 text-espresso-800/70">
                  <th className="py-3 px-3 whitespace-nowrap">المستخدم</th>
                  <th className="py-3 px-3 whitespace-nowrap">الجوال / البريد</th>
                  <th className="py-3 px-3 whitespace-nowrap">رصيد النقاط والتحكم</th>
                  <th className="py-3 px-3 whitespace-nowrap">الصلاحية</th>
                  <th className="py-3 px-3 whitespace-nowrap">الحالة</th>
                  <th className="py-3 px-3 text-left whitespace-nowrap">إجراء الحظر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200/70">
                {filteredUsers.map((u) => {
                  const blocked = Boolean(u.is_blocked);
                  return (
                    <tr key={u.id} className={`transition ${blocked ? "bg-rose-50/60" : "hover:bg-cream-50"}`}>
                      <td className="py-3.5 px-3 font-bold text-espresso-900 whitespace-nowrap">{u.name || "مستخدم بدون اسم"}</td>

                      <td className="py-3.5 px-3 text-espresso-800 whitespace-nowrap">
                        <span dir="ltr" className="inline-block font-mono text-xs">
                          {u.phone_or_email || "—"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-rosewarm-600 min-w-[65px]">{Number(u.points_balance || 0)} نقطة</span>
                          <button
                            type="button"
                            onClick={() => openPointsModal(u)}
                            className="bg-gold-100 hover:bg-gold-400 text-espresso-900 border border-gold-400/70 text-[11px] font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <i className="fa-solid fa-sliders text-rosewarm-600 text-[10px]" />
                            <span>تعديل النقاط</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <select
                          value={u.role || "CUSTOMER"}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded-xl bg-cream-100 border border-cream-300 px-2.5 py-1 text-xs font-bold text-espresso-900 cursor-pointer"
                        >
                          <option value="CUSTOMER">عميل (CUSTOMER)</option>
                          <option value="STAFF">موظف (STAFF)</option>
                          <option value="ADMIN">مدير (ADMIN)</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            blocked ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {blocked ? "محظور 🚫" : "نشط ✓"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-left whitespace-nowrap">
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

      {/* Manual Points Adjustment Modal */}
      {pointsModalUser && (
        <div
          dir="rtl"
          onClick={() => setPointsModalUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-cream-50 border-2 border-gold-400 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 bg-espresso-900 text-cream-50 flex items-center justify-between border-b border-gold-500/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold-500 text-espresso-900 flex items-center justify-center font-bold">
                  <i className="fa-solid fa-coins" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold">تعديل رصيد نقاط العميل</h3>
                  <p className="text-[11px] text-gold-400">{pointsModalUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPointsModalUser(null)}
                className="w-8 h-8 rounded-full bg-espresso-800 hover:bg-rosewarm-500 text-white flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleConfirmPointsAdjustment} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-cream-200/70 rounded-2xl border border-cream-300">
                <button
                  type="button"
                  onClick={() => setPointsOperation("ADD")}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    pointsOperation === "ADD" ? "bg-emerald-600 text-white shadow-sm" : "text-espresso-800 hover:text-espresso-900"
                  }`}
                >
                  <i className="fa-solid fa-circle-plus" />
                  <span>إضافة نقاط (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPointsOperation("DEDUCT")}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    pointsOperation === "DEDUCT" ? "bg-rose-600 text-white shadow-sm" : "text-espresso-800 hover:text-espresso-900"
                  }`}
                >
                  <i className="fa-solid fa-circle-minus" />
                  <span>خصم نقاط (-)</span>
                </button>
              </div>

              <div>
                <span className="block text-xs font-bold text-espresso-800/80 mb-2">اختيار سريع:</span>
                <div className="flex flex-wrap gap-2">
                  {[10, 25, 50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPointsAmount(preset)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                        pointsAmount === preset
                          ? "bg-espresso-900 text-gold-400 border-espresso-900"
                          : "bg-white hover:bg-cream-200 text-espresso-900 border-cream-300"
                      }`}
                    >
                      {pointsOperation === "ADD" ? `+${preset}` : `-${preset}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                  عدد النقاط المراد {pointsOperation === "ADD" ? "إضافتها" : "خصمها"}:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  required
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-2xl bg-white border border-cream-300 px-4 py-3 text-center text-lg font-extrabold text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                />
              </div>

              <div className="bg-cream-200/60 border border-cream-300 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="text-espresso-800/70 block">الرصيد الحالي:</span>
                  <strong className="text-base text-espresso-900">{Number(pointsModalUser.points_balance || 0)} نقطة</strong>
                </div>

                <i className="fa-solid fa-arrow-left text-gold-600 text-base" />

                <div className="text-left">
                  <span className="text-espresso-800/70 block">الرصيد بعد التعديل:</span>
                  <strong className={`text-lg font-extrabold ${pointsOperation === "ADD" ? "text-emerald-700" : "text-rose-600"}`}>
                    {previewBalance} نقطة
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPointsModalUser(null)}
                  className="px-5 py-3 rounded-full text-xs font-bold text-espresso-800 hover:bg-cream-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingPoints || pointsAmount <= 0}
                  className={`flex-1 py-3 px-6 rounded-full text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-50 ${
                    pointsOperation === "ADD" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {savingPoints
                    ? "جاري الحفظ..."
                    : pointsOperation === "ADD"
                      ? `تأكيد إضافة +${pointsAmount} نقطة`
                      : `تأكيد خصم -${pointsAmount} نقطة`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
