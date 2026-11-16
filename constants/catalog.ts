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
//     icon: "fa-solid fa-mug-hot",
//     description: "لأن البهجة لا تنتظر موعداً؛ باقات عفوية ناعمة تشرق بها أيام من تحب.",
//   },
// ];
