import "./globals.css";
import { Amiri, Tajawal } from "next/font/google";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

export const metadata = {
  title: "زهرة لينا | Zahrat Lina - للزهور الفاخرة والهدايا",
  description: "وجهتكم الأولى في جازان لأرقى باقات الورد الطبيعي وتنسيقات الهدايا",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${amiri.variable} scroll-smooth`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className="min-h-screen flex flex-col bg-cream-100 text-espresso-900 font-sans selection:bg-rosewarm-500 selection:text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
