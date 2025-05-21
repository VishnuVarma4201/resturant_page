
import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  hidePadding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hidePadding = false }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-grow ${!hidePadding ? 'container-custom py-8' : ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
