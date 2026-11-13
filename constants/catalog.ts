export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  badge?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  title: string;
  price: number;
  description: string;
  image: string;
  tags: string[];
  featured?: boolean;
  pointsPrice?: number | null;
  isActive?: boolean;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  giftMessage: string;
  packagingColor: string;
}

export const STORE_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "966530346444";

// export const CATEGORIES: Category[] = [
//   {
//     id: 1,
//     name: "باقات بدون مناسبة",
//     shortLabel: "بدون مناسبة",
//     icon: "fa-solid fa-mug-hot",
//     description: "لأن البهجة لا تنتظر موعداً؛ باقات عفوية ناعمة تشرق بها أيام من تحب.",
//     badgeColor: "bg-amber-100 text-amber-800",
//   },
//   {
//     id: 2,
//     name: "باقات اعتذار",
//     shortLabel: "باقات اعتذار",
//     icon: "fa-solid fa-dove",
//     description: "رسائل سلام وصفاء من الزهور البيضاء والباستيل لتطييب الخواطر بأرقى أسلوب.",
//     badgeColor: "bg-sky-100 text-sky-800",
//   },
//   {
//     id: 3,
//     name: "باقات حب",
//     shortLabel: "باقات حب",
//     icon: "fa-solid fa-heart",
//     description: "تناغم الجوري الأحمر المخملي والزهور الرومانسية التي تنبض بأصدق المشاعر.",
//     badgeColor: "bg-rose-100 text-rose-800",
//   },
//   {
//     id: 4,
//     name: "باقات ميلاد",
//     shortLabel: "باقات ميلاد",
//     icon: "fa-solid fa-cake-candles",
//     description: "تنسيقات مبهجة ومشرقة تحتفل بعام جديد مليء بالفرح والجمال.",
//     badgeColor: "bg-purple-100 text-purple-800",
//   },
//   {
//     id: 5,
//     name: "باقات تخرج",
//     shortLabel: "باقات تخرج",
//     icon: "fa-solid fa-graduation-cap",
//     description: "باقات فخامة تليق بفرحة الإنجاز والنجاح مع لمسات تخرج أنيقة.",
//     badgeColor: "bg-indigo-100 text-indigo-800",
//   },
//   {
//     id: 6,
//     name: "باقات سلامة",
//     shortLabel: "باقات سلامة",
//     icon: "fa-solid fa-hand-holding-heart",
//     description: "زهور هادئة ومنعشة تبعث الطمأنينة وتمنيات الشفاء العاجل والعافية.",
//     badgeColor: "bg-emerald-100 text-emerald-800",
//   },
//   {
//     id: 7,
//     name: "باقات مواليد",
//     shortLabel: "باقات مواليد",
//     icon: "fa-solid fa-baby-carriage",
//     description: "تنسيقات ساحرة لاستقبال المواليد الجدد بألوان سماوية ووردية ومحايدة.",
//     badgeColor: "bg-pink-100 text-pink-800",
//   },
//   {
//     id: 8,
//     name: "باقات الهبة",
//     shortLabel: "باقات الهبة",
//     icon: "fa-solid fa-fire-flame-curved",
//     description: "أحدث صيحات تنسيق الورد (الترند) بتغليفات مبتكرة وأحجام خاطفة للأنظار.",
//     badgeColor: "bg-orange-100 text-orange-800",
//   },
//   {
//     id: 9,
//     name: "الهدايا والماركة",
//     shortLabel: "الهدايا والماركة",
//     icon: "fa-solid fa-gem",
//     description: "صناديق إهداء فاخرة تجمع بين الورد الطبيعي والعطور والشوكولاتة والماركات العالمية.",
//     badgeColor: "bg-yellow-100 text-yellow-800",
//   },
//   {
//     id: 10,
//     name: "أكياس هدايا وتحديد الجنس والكماليات",
//     shortLabel: "أكياس وتحديد الجنس والكماليات",
//     icon: "fa-solid fa-gift",
//     description: "أكياس إهداء فاخرة، بالونات وبوكسات تحديد جنس المولود (Boy or Girl)، وكروت وتغليفات.",
//     badgeColor: "bg-teal-100 text-teal-800",
//   },
// ];
