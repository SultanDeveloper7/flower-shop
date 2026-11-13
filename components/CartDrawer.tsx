"use client";

import { useState } from "react";
import { CartItem, Category, STORE_WHATSAPP_NUMBER } from "@/constants/catalog";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (cartItemId: string, delta: number) => void;
  onRemove: (cartItemId: string) => void;
  categories: Category[];
}

export default function CartDrawer({ isOpen, categories, onClose, cart, onUpdateQty, onRemove }: CartDrawerProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const buildWhatsAppOrderText = () => {
    const lines = [
      `🌸 *طلب جديد من متجر زهرة لينا (Zahrat Lina)* 🌸`,
      `────────────────────`,
      `👤 *الاسم:* ${customerName.trim() || "عميل زهرة لينا"}`,
      `📍 *العنوان/الاستلام:* ${customerAddress.trim() || "سيتم تحديده عبر المحادثة"}`,
      `────────────────────`,
      `🛍️ *المنتجات المطلوبة:*`,
    ];

    cart.forEach((item, index) => {
      const cat = categories.find((c) => c.id === item.product.categoryId);
      lines.push(`${index + 1}. *${item.product.title}* (${cat ? cat.name : ""})`);
      lines.push(`   • الكمية: ${item.quantity} × ${item.product.price} ر.س = *${item.quantity * item.product.price} ر.س*`);
      lines.push(`   • لون التغليف: ${item.packagingColor}`);
      if (item.giftMessage) {
        lines.push(`   • 💌 عبارة الكرت: "${item.giftMessage}"`);
      }
    });

    lines.push(`────────────────────`);
    lines.push(`💰 *الإجمالي الكلي:* ${totalPrice} ر.س`);
    lines.push(`📍 فرع زهرة لينا: جازان - حي السويس - مقابل النقل الجماعي`);

    return lines.join("\n");
  };

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-espresso-900/50 backdrop-blur-sm transition-opacity" />
      <aside className="fixed top-0 left-0 bottom-0 z-50 w-full max-w-md bg-cream-50 shadow-2xl border-r border-cream-300 flex flex-col">
        <div className="p-5 bg-espresso-900 text-cream-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <i className="fa-solid fa-bag-shopping text-gold-400 text-lg" />
            <h3 className="font-serif text-xl font-bold">سلة المشتريات - زهرة لينا</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-espresso-800 hover:bg-rosewarm-500 text-white flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-cream-200 text-rosewarm-500 flex items-center justify-center mx-auto text-2xl">
                <i className="fa-solid fa-basket-shopping" />
              </div>
              <h4 className="font-serif text-xl font-bold text-espresso-900">سلتك فارغة حالياً</h4>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartItemId} className="bg-white p-3.5 rounded-2xl border border-cream-300 shadow-sm flex gap-3.5 items-start">
                <img
                  src={item.product.image}
                  alt={item.product.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-cream-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-xs sm:text-sm text-espresso-900 truncate">{item.product.title}</h5>
                    <button onClick={() => onRemove(item.cartItemId)} className="text-espresso-800/40 hover:text-rose-600 text-xs">
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-rosewarm-600 mt-0.5">{item.product.price} ر.س</p>
                  <p className="text-[11px] text-espresso-800/70 mt-1">التغليف: {item.packagingColor}</p>
                  {item.giftMessage && (
                    <p className="text-[11px] bg-rosewarm-100/70 text-rosewarm-700 p-1.5 rounded-lg mt-1.5">
                      &ldquo;{item.giftMessage}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-cream-200">
                    <div className="flex items-center gap-2 bg-cream-100 rounded-lg px-2 py-0.5 border border-cream-300">
                      <button onClick={() => onUpdateQty(item.cartItemId, -1)} className="text-xs font-bold px-1.5">
                        -
                      </button>
                      <span className="text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.cartItemId, 1)} className="text-xs font-bold px-1.5">
                        +
                      </button>
                    </div>
                    <span className="text-xs font-extrabold">{item.product.price * item.quantity} ر.س</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 bg-cream-200/80 border-t border-cream-300 space-y-4">
          <div className="space-y-2.5">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="اسم المستلم أو المرسل (اختياري)"
              className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2 text-xs sm:text-sm"
            />
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="حي التوصيل في جازان أو استلام من الفرع"
              className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-cream-300">
            <span className="text-sm font-semibold text-espresso-800">الإجمالي التقديري:</span>
            <span className="text-xl font-extrabold text-rosewarm-600">{totalPrice} ر.س</span>
          </div>

          <a
            href={cart.length > 0 ? `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppOrderText())}` : "#"}
            target={cart.length > 0 ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-full shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            <i className="fa-brands fa-whatsapp text-lg" />
            <span>إتمام الطلب عبر واتساب</span>
          </a>
        </div>
      </aside>
    </>
  );
}
