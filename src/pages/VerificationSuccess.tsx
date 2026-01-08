import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VerificationSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Check if user is now authenticated after email verification
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        toast({
          title: "Email berhasil diverifikasi!",
          description: "Anda akan diarahkan ke dashboard.",
        });
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        // If no session, wait a bit and try again
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            toast({
              title: "Email berhasil diverifikasi!",
              description: "Anda akan diarahkan ke dashboard.",
            });
            setTimeout(() => {
              navigate("/dashboard");
            }, 2000);
          } else {
            toast({
              title: "Verifikasi berhasil!",
              description: "Silakan login untuk melanjutkan.",
            });
            navigate("/auth");
          }
          setVerifying(false);
        }, 2000);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md glass-card-strong">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {verifying ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="h-16 w-16 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {verifying ? "Memverifikasi..." : "Verifikasi Berhasil!"}
          </CardTitle>
          <CardDescription>
            {verifying 
              ? "Mohon tunggu sebentar, kami sedang memverifikasi email Anda."
              : "Email Anda telah berhasil diverifikasi."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {verifying 
            ? "Anda akan segera diarahkan ke dashboard..."
            : "Anda akan diarahkan ke halaman login..."}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationSuccess;
