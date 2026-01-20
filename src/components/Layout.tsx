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
          isMobile ? 'ml-0 pt-12' : 'ml-16'
        }`}
      >
        {/* Mobile: Header bar dengan semua kontrol */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-40 h-12  bg-background/60 backdrop-blur-md flex items-center justify-end px-3">
            <div className="flex items-center gap-1.5">
              <DarkModeToggle />
              <AuthButton />
            </div>
          </div>
        )}
        
        {/* Desktop: Posisi fixed di pojok kanan */}
        {!isMobile && (
          <div className="fixed z-80 flex items-center gap-2 top-4 right-4">
            <DarkModeToggle />
            <AuthButton />
          </div>
        )}
        
        {children}
      </main>
    </div>
  );
};
