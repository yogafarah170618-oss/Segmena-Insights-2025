import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password tidak cocok",
        description: "Password dan konfirmasi password harus sama.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password terlalu pendek",
        description: "Password harus minimal 6 karakter.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verification-success`,
          data: {
            full_name: name,
          }
        },
      });

      if (error) throw error;

      toast({
        title: "Berhasil mendaftar!",
        description: "Silakan cek email Anda untuk verifikasi akun.",
      });
      
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Gagal mendaftar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, check if the email exists by attempting a password reset
      // This is a workaround since Supabase doesn't expose user existence check
      const { data: signUpCheck } = await supabase.auth.signUp({
        email,
        password: 'dummy-check-password-12345',
      });
      
      // If signUp returns a user with identities array empty or user already exists indication
      // it means the email is already registered
      const emailExists = signUpCheck?.user?.identities?.length === 0 || 
                          signUpCheck?.user?.id !== undefined;
      
      // Now attempt the actual login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMsg = error.message?.toLowerCase() || "";
        
        if (errorMsg.includes("invalid login credentials") || errorMsg.includes("invalid_credentials")) {
          // Check if email exists to differentiate between wrong password and non-existent account
          if (!emailExists || signUpCheck?.user?.identities?.length !== 0) {
            throw { 
              message: "user_not_found",
              isCustom: true 
            };
          } else {
            throw { 
              message: "wrong_password",
              isCustom: true 
            };
          }
        }
        throw error;
      }

      toast({
        title: "Berhasil login!",
        description: "Selamat datang kembali.",
      });
      navigate("/");
    } catch (error: any) {
      let errorTitle = "Gagal login";
      let errorDescription = "Terjadi kesalahan saat login.";
      
      if (error.message === "user_not_found") {
        errorTitle = "Akun tidak ditemukan";
        errorDescription = "Email tidak terdaftar. Silakan daftar terlebih dahulu.";
      } else if (error.message === "wrong_password") {
        errorTitle = "Password salah";
        errorDescription = "Password yang Anda masukkan tidak valid.";
      } else if (error.message?.toLowerCase().includes("email not confirmed")) {
        errorTitle = "Email belum diverifikasi";
        errorDescription = "Silakan cek email Anda untuk verifikasi akun.";
      } else if (error.message) {
        errorDescription = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email terkirim!",
        description: "Silakan cek email Anda untuk reset password.",
      });
      
      setShowForgotPassword(false);
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Gagal mengirim email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 overflow-x-hidden relative">
      {/* Background Decorations */}
      <div className="blur-orb blur-orb-primary w-96 h-96 top-20 -left-48" />
      <div className="blur-orb blur-orb-accent w-80 h-80 bottom-20 -right-40" />
      <div className="blur-orb blur-orb-secondary w-72 h-72 top-1/2 left-1/4" />

      <Button
        variant="glass"
        size="icon"
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 w-10 h-10 sm:w-12 sm:h-12"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      <div className="w-full max-w-md px-1 sm:px-0 relative z-10">
        {/* Title */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold mb-2 sm:mb-4 gradient-text leading-tight pb-2">Segmena</h1>
          <div className="inline-block soft-badge px-3 sm:px-4 py-1.5">
            <span className="text-xs sm:text-sm font-medium">Customer Intelligence</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="glass-card overflow-hidden">
          {/* Tab Buttons */}
          <div className="grid grid-cols-2 border-b border-white/10">
            <button
              onClick={() => setActiveTab('login')}
              className={`py-3 sm:py-4 font-display font-semibold text-xs sm:text-sm tracking-wider transition-all ${
                activeTab === 'login' 
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary' 
                  : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`py-3 sm:py-4 font-display font-semibold text-xs sm:text-sm tracking-wider transition-all border-l border-white/10 ${
                activeTab === 'signup' 
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary' 
                  : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'login' && (
              <>
                {!showForgotPassword ? (
                  <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="login-email" className="text-[10px] sm:text-xs tracking-wider text-muted-foreground">EMAIL</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="login-password" className="text-[10px] sm:text-xs tracking-wider text-muted-foreground">PASSWORD</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          minLength={6}
                          className="pr-12 h-11 sm:h-12 text-sm sm:text-base"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs sm:text-sm text-primary hover:underline"
                        onClick={() => setShowForgotPassword(true)}
                        disabled={loading}
                      >
                        Lupa password?
                      </button>
                    </div>
                    <Button type="submit" variant="gradient" className="w-full h-11 sm:h-12 text-sm sm:text-base" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-xs tracking-wider text-muted-foreground">EMAIL</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Masukkan email Anda untuk reset password
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setEmail("");
                        }}
                        disabled={loading}
                      >
                        Batal
                      </Button>
                      <Button type="submit" variant="gradient" className="flex-1" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kirim
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-xs tracking-wider text-muted-foreground">NAMA LENGKAP</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Nama Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-xs tracking-wider text-muted-foreground">EMAIL</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-xs tracking-wider text-muted-foreground">PASSWORD</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-xs tracking-wider text-muted-foreground">KONFIRMASI PASSWORD</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimal 6 karakter
                  </p>
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Daftar
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;