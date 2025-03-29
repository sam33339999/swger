"use client";

import React from "react";
import dynamic from "next/dynamic";

// 使用動態導入以避免SSR問題
const SwaggerUI = dynamic(() => import("./components/swagger/SwaggerUI"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="container mx-auto p-4 min-h-screen">
      <SwaggerUI />
    </div>
  );
}
