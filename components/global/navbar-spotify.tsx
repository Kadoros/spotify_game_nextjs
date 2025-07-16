import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { profile, logout, loading } = useSpotifyAuth();
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

          <DropdownMenuContent align="end" className="w-48 bg-white text-black">
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
  );
};

export default Navbar;
