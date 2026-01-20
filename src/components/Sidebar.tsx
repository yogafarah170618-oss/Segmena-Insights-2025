import { Home, Upload, BarChart3, Target, Menu, History, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import segmenaLogo from "@/assets/segmena-logo.png";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

const navItems = [
  { title: "Home", icon: Home, path: "/" },
  { title: "Upload", icon: Upload, path: "/upload" },
  { title: "Dashboard", icon: BarChart3, path: "/dashboard" },
  { title: "Segments", icon: Target, path: "/segments" },
  { title: "History", icon: History, path: "/history" },
];

const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
  <div className="flex flex-col items-center py-6 space-y-6">
    {/* Logo */}
    <NavLink to="/" className="mb-2 group" onClick={onNavClick}>
      <div className="w-14 h-14 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
        <img src={segmenaLogo} alt="Segmena Logo" className="w-14 h-14 object-contain drop-shadow-sm transition-all duration-300 group-hover:drop-shadow-lg" />
      </div>
    </NavLink>

    {/* Navigation */}
    <nav className="flex flex-col items-center space-y-2 w-full px-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavClick}
          className={cn(
            cn(
               "w-full h-12 flex items-center justify-center rounded-xl transition-all backdrop-blur-md",
                "bg-white/40 text-slate-600 hover:bg-white/70 hover:shadow-md",
                "dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800/70"
             ) 
          )}
          activeClassName="bg-foreground text-background"
        >
          <item.icon className="w-5 h-5" />
        </NavLink>
      ))}
    </nav>
  </div>
);

const MobileSidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
  <div className="flex flex-col h-full 
    bg-background/70 backdrop-blur-xl border-r border-border/40">

    {/* Header */}
    <div className="flex items-center gap-3 px-4 py-4 border-b border-border/30">
      <img src={segmenaLogo} className="w-10 h-10" />
      <span className="font-semibold text-lg tracking-wide">SEGMENA</span>
    </div>

    {/* Navigation */}
    <nav className="flex flex-col gap-2 px-4 py-4">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavClick}
          className={cn(
            "h-12 rounded-xl flex items-center gap-4 px-4",
            "bg-muted/40 hover:bg-muted/70 transition-all",
            "backdrop-blur-md"
          )}
          activeClassName="bg-primary text-primary-foreground shadow-md"
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.title}</span>
        </NavLink>
      ))}
    </nav>
  </div>
);

export const Sidebar = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Mobile: hamburger menu
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="fixed top-2.5 left-2 z-[90] w-8 h-8 border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-all">
            <Menu className="w-4 h-4" />
          </button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-72 p-0 bg-background/60 backdrop-blur-xl border-r border-border/40"
        >
          <MobileSidebarContent onNavClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside className="fixed left-4 top-4 z-50 h-[calc(100vh-2rem)] w-16 rounded-2xl backdrop-blur-xl shadow-lg border  bg-white/60 border-white/40  dark:bg-slate-900/60 dark:border-white/10">
      <SidebarContent />
    </aside>
  );
};
