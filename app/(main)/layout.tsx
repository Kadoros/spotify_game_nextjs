"use client";

import React from "react";

const MainLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header */}
      {/* <header className="flex justify-end items-center p-4 gap-4 h-16"></header> */}

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
