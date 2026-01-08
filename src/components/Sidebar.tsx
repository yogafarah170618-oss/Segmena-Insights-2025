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
            "w-full h-12 border-3 border-border flex items-center justify-center transition-all bg-card",
            "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal"
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
  <div className="flex flex-col py-6 h-full">
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
            "h-12 border-3 border-border flex items-center gap-3 px-4 transition-all bg-card font-mono text-sm",
            "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal"
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
          <button className="fixed top-3 left-3 z-[60] w-10 h-10 border-2 border-border bg-card shadow-brutal flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover transition-all">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-64 p-0 border-r-3 border-border bg-card z-[70]"
        >
          <MobileSidebarContent onNavClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside className="fixed left-0 top-0 h-screen w-16 border-r-3 border-border bg-card z-50">
      <SidebarContent />
    </aside>
  );
};
