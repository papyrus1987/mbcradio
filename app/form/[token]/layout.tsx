import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "주소 입력 - 라디오 상품 발송",
  description: "당첨 상품 배송을 위한 주소 입력 페이지",
};

export default function FormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
