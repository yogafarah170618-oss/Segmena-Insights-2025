import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-none border border-border sm:border-2 bg-background hover:bg-accent"
      >
        <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-none border border-border sm:border-2 bg-background hover:bg-accent transition-all duration-300 hover:scale-105"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-foreground transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground transition-transform duration-300 rotate-0" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
