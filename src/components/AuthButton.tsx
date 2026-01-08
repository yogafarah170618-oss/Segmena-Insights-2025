import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, Session } from "@supabase/supabase-js";
import { LogOut, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

export const AuthButton = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Gagal logout",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil logout",
        description: "Sampai jumpa lagi!",
      });
      navigate("/");
    }
  };

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate("/auth")}
          className="text-xs sm:text-sm px-3 sm:px-4"
        >
          LOGIN
        </Button>
        <Button 
          onClick={() => navigate("/auth")}
          className="text-xs sm:text-sm px-3 sm:px-4"
        >
          SIGN UP
        </Button>
      </div>
    );
  }

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.substring(0, 2).toUpperCase() || "US";
  };

  const displayName = profile?.full_name || user?.email || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-border bg-foreground text-background flex items-center justify-center font-brutal text-sm shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover transition-all">
          {getInitials()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-3 border-border bg-card shadow-brutal" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-brutal">{displayName}</p>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border h-[3px]" />
        <DropdownMenuItem 
          onClick={() => navigate("/profile")}
          className="font-mono text-sm cursor-pointer hover:bg-muted"
        >
          <UserCircle className="mr-2 h-4 w-4" />
          EDIT PROFIL
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="font-mono text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          LOGOUT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
