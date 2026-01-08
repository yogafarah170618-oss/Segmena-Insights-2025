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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Berhasil login!",
        description: "Selamat datang kembali.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Gagal login",
        description: error.message,
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
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 dotted-bg overflow-x-hidden">
      <Button
        variant="outline"
        size="icon"
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 w-10 h-10 sm:w-12 sm:h-12"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      <div className="w-full max-w-md px-1 sm:px-0">
        {/* Title */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-brutal mb-2 sm:mb-4">SEGMENA</h1>
          <div className="inline-block bg-secondary px-3 sm:px-4 py-1 border-3 border-border shadow-brutal -rotate-1">
            <span className="font-mono text-secondary-foreground text-xs sm:text-sm">CUSTOMER INTELLIGENCE</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="border-3 border-border bg-card shadow-brutal-lg">
          {/* Tab Buttons */}
          <div className="grid grid-cols-2 border-b-3 border-border">
            <button
              onClick={() => setActiveTab('login')}
              className={`py-3 sm:py-4 font-brutal text-xs sm:text-sm tracking-wider transition-colors ${
                activeTab === 'login' 
                  ? 'bg-foreground text-background' 
                  : 'bg-card hover:bg-muted'
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`py-3 sm:py-4 font-brutal text-xs sm:text-sm tracking-wider transition-colors border-l-3 border-border ${
                activeTab === 'signup' 
                  ? 'bg-foreground text-background' 
                  : 'bg-card hover:bg-muted'
              }`}
            >
              SIGN UP
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'login' && (
              <>
                {!showForgotPassword ? (
                  <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="login-email" className="font-brutal text-[10px] sm:text-xs tracking-wider">EMAIL</Label>
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
                      <Label htmlFor="login-password" className="font-brutal text-[10px] sm:text-xs tracking-wider">PASSWORD</Label>
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
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs sm:text-sm font-mono underline hover:no-underline"
                        onClick={() => setShowForgotPassword(true)}
                        disabled={loading}
                      >
                        Lupa password?
                      </button>
                    </div>
                    <Button type="submit" className="w-full h-11 sm:h-12 text-sm sm:text-base" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      LOGIN
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="font-brutal text-xs tracking-wider">EMAIL</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <p className="text-xs font-mono text-muted-foreground">
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
                        BATAL
                      </Button>
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        KIRIM
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="font-brutal text-xs tracking-wider">NAMA LENGKAP</Label>
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
                  <Label htmlFor="signup-email" className="font-brutal text-xs tracking-wider">EMAIL</Label>
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
                  <Label htmlFor="signup-password" className="font-brutal text-xs tracking-wider">PASSWORD</Label>
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
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="font-brutal text-xs tracking-wider">KONFIRMASI PASSWORD</Label>
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
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">
                    Minimal 6 karakter
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  DAFTAR
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
