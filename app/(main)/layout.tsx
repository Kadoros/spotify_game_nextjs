"use client";

import React from "react";

import Navbar from "@/components/global/navbar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <Navbar />

      <main className="flex-1 overflow-y-auto px-4 h-full">{children}</main>
    </div>
  );
};

export default MainLayout;
