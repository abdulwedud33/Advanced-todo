import type { Metadata } from "next";
import "../globals.css";
import Link from "next/link";
import Header from "../../components/headerComp";
import FooterComp from "../../components/FooterComp";
import { AuthProvider } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";

export const metadata: Metadata = {
  title: "Advanced-To-Do-App",
  description: "Published by Abdulwedud Yassin",
};

export default function HomeAndCompletedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProtectedRoute>
            <Header />
            {children}
            <FooterComp />
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
