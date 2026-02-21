import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-sans antialiased">
      <LayoutWrapper>{children}</LayoutWrapper>
    </div>
  );
}
