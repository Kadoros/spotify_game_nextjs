"use client";

import React from "react";
import Link from "next/link";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext"; // ✅ new path
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, logout, loading } = useSpotifyAuth();
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <header className="h-16 w-full px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/50 backdrop-blur">
        <Button
          variant="ghost"
          className="text-lg font-semibold text-white"
          onClick={() => router.push("/")}
        >
          Guess Repeat
        </Button>

        {!loading && profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage
                  src={profile.images?.[0]?.url}
                  alt={profile.display_name}
                />
                <AvatarFallback>
                  {profile.display_name?.slice(0, 2).toUpperCase() || "SP"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-48 bg-white text-black"
            >
              <DropdownMenuLabel>{profile.display_name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile" passHref>
                <DropdownMenuItem className="cursor-pointer">
                  Profile
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 h-full">{children}</main>
    </div>
  );
};

export default MainLayout;
