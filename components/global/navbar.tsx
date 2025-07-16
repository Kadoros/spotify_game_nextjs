"use client";
import React from "react";

import { useConvexAuth } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  return (
    <header className="h-16 w-full px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/50 backdrop-blur">
      <Button
        variant="ghost"
        className="text-lg font-semibold text-white"
        onClick={() => router.push("/")}
      >
        Guess Repeat
      </Button>
      <div>
        {isLoading && <h3>Loading...</h3>}
        {!isAuthenticated && !isLoading && (
          <>
            <SignInButton mode="modal">
              <Button variant={"ghost"} size="sm">
                Log in
              </Button>
            </SignInButton>
            <SignInButton
              mode="modal"
              signUpForceRedirectUrl={"/"}
              signUpFallbackRedirectUrl={"/"}
            >
              <Button size="sm">Get Kotion free</Button>
            </SignInButton>
          </>
        )}
        {isAuthenticated && !isLoading && (
          <>
            <UserButton />
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
