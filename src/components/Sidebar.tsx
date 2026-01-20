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
  <div className="flex flex-col py-6 h-full backdrop-blur-xl">
    {/* Logo */}
    <div className="px-4 mb-6">
      <NavLink to="/" onClick={onNavClick} className="flex items-center gap-3 group">
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
          <img src={segmenaLogo} alt="Segmena Logo" className="w-12 h-12 object-contain drop-shadow-sm transition-all duration-300 group-hover:drop-shadow-lg" />
        </div>
        <span className="font-brutal text-xl">SEGMENA</span>
      </NavLink>
    </div>

    {/* Navigation */}
    <nav className="flex flex-col space-y-2 px-4 flex-1">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavClick}
          className={cn(
            "h-12 flex items-center gap-3 px-4 rounded-xl transition-all backdrop-blur-md",
            "bg-white/40 text-slate-700 hover:bg-white/70 hover:shadow-md",
            "dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800/70"
          )}
          activeClassName="bg-foreground text-background"
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className="uppercase tracking-wider">{item.title}</span>
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
          className="w-64 p-0 z-[70] backdrop-blur-xl border-r border-white/30 bg-white/70 dark:bg-slate-900/70"
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
