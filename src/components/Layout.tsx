import { Sidebar } from "./Sidebar";
import { AuthButton } from "./AuthButton";
import { DarkModeToggle } from "./DarkModeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen w-full flex overflow-x-hidden">
      <Sidebar />
      <main 
        className={`flex-1 w-full min-w-0 ${
          isMobile ? 'ml-0 pt-14' : 'ml-16'
        }`}
      >
        {/* Mobile: Header bar dengan semua kontrol */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b-3 border-border flex items-center justify-end px-3 pl-14">
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <AuthButton />
            </div>
          </div>
        )}
        
        {/* Desktop: Posisi fixed di pojok kanan */}
        {!isMobile && (
          <div className="fixed z-50 flex items-center gap-2 top-4 right-4">
            <DarkModeToggle />
            <AuthButton />
          </div>
        )}
        
        {children}
      </main>
    </div>
  );
};
