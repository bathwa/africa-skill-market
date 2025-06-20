import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { ModeToggle } from './ModeToggle';
import { Sun, Moon } from "lucide-react"

const Header = () => {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast()

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  };

  return (
    <header className="bg-background border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="text-2xl font-bold">
          SkillZone
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          {profile && (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              {profile.role === 'client' && (
                <>
                  <Link to="/client/create" className="text-gray-600 hover:text-gray-900">
                    Create Opportunity
                  </Link>
                  <Link to="/client/manage" className="text-gray-600 hover:text-gray-900">
                    My Opportunities
                  </Link>
                </>
              )}
              {(profile.role === 'service_provider' || profile.role === 'admin' || profile.role === 'super_admin') && (
                <Link to="/opportunities" className="text-gray-600 hover:text-gray-900">
                  Opportunities
                </Link>
              )}
              <Link to="/providers" className="text-gray-600 hover:text-gray-900">
                Service Providers
              </Link>
              {(profile.role === 'admin' || profile.role === 'super_admin') && (
                <Link to="/admin" className="text-gray-600 hover:text-gray-900">
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <ModeToggle />
          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatar.vercel.sh/${profile.email}.png`} alt={profile.name} />
                    <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link to="/register" className="bg-primary text-primary-foreground rounded-md px-4 py-2 hover:bg-primary/80">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
