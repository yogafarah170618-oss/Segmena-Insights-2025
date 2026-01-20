import { Home, Upload, BarChart3, Target, Menu, History } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import segmenaLogo from "@/assets/segmena-logo.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
      <div className="w-14 h-14 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        <img src={segmenaLogo} alt="Segmena Logo" className="w-14 h-14 object-contain drop-shadow-lg transition-all duration-300" />
      </div>
    </NavLink>

    {/* Navigation */}
    <nav className="flex flex-col items-center space-y-3 w-full px-3">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavClick}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
            "bg-white/10 backdrop-blur-sm border border-white/20",
            "hover:bg-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
          )}
          activeClassName="bg-gradient-to-br from-primary to-primary/70 text-white border-primary/50 shadow-lg shadow-primary/30"
        >
          <item.icon className="w-5 h-5" />
        </NavLink>
      ))}
    </nav>
  </div>
);

const MobileSidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
  <div className="flex flex-col py-6 h-full">
    {/* Logo */}
    <div className="px-4 mb-6">
      <NavLink to="/" onClick={onNavClick} className="flex items-center gap-3 group">
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
          <img src={segmenaLogo} alt="Segmena Logo" className="w-12 h-12 object-contain drop-shadow-lg transition-all duration-300" />
        </div>
        <span className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          SEGMENA
        </span>
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
            "h-12 rounded-xl flex items-center gap-3 px-4 transition-all duration-300",
            "bg-white/10 backdrop-blur-sm border border-white/20",
            "hover:bg-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-primary/20"
          )}
          activeClassName="bg-gradient-to-r from-primary to-primary/70 text-white border-primary/50 shadow-lg shadow-primary/30"
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{item.title}</span>
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
          <button className="fixed top-3 left-3 z-[60] w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center hover:bg-white/20 hover:border-white/40 transition-all duration-300">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-64 p-0 bg-background/80 backdrop-blur-xl border-r border-white/20 z-[70]"
        >
          <MobileSidebarContent onNavClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside className="fixed left-0 top-0 h-screen w-[72px] bg-background/60 backdrop-blur-xl border-r border-white/20 z-50 shadow-xl shadow-black/5">
      <SidebarContent />
    </aside>
  );
};
