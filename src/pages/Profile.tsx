import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, ArrowLeft, Upload, X } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface UserData {
  email: string;
  userId: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserData({
        email: session.user.email || "",
        userId: session.user.id,
      });

      await loadProfile(session.user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (error: any) {
      toast({
        title: "Gagal memuat profil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Format tidak didukung",
        description: "Gunakan format JPG, PNG, GIF, atau WEBP",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran maksimal 2MB",
        variant: "destructive",
      });
      return;
    }

    if (!userData?.userId) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.userId}/${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);

      toast({
        title: "Berhasil!",
        description: "Avatar berhasil diupload",
      });
    } catch (error: any) {
      toast({
        title: "Gagal upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl || !userData?.userId) return;

    setUploading(true);

    try {
      const oldPath = avatarUrl.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
      setAvatarUrl("");

      toast({
        title: "Berhasil!",
        description: "Avatar berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Gagal menghapus",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Berhasil!",
        description: "Profil berhasil diperbarui.",
      });

      await loadProfile(session.user.id);
    } catch (error: any) {
      toast({
        title: "Gagal menyimpan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name || !name.trim()) {
      return userData?.email?.charAt(0).toUpperCase() || "U";
    }
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dotted-bg">
        <div className="w-12 h-12 border-3 border-border bg-card flex items-center justify-center shadow-brutal">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/")}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="border-3 border-border p-4 sm:p-6 bg-foreground text-background shadow-brutal flex-1">
          <h1 className="text-2xl sm:text-4xl font-brutal mb-2">PROFIL SAYA</h1>
          <p className="font-mono text-sm text-background/70">Kelola informasi profil Anda</p>
        </div>
      </div>

      {/* Main Card */}
      {/* Main Card */}
      <div className="border-3 border-border bg-card shadow-brutal w-full">
        {/* Card Header */}
        <div className="p-4 sm:p-6 border-b-3 border-border">
          <h2 className="text-xl font-brutal">INFORMASI PROFIL</h2>
          <p className="font-mono text-sm text-muted-foreground">Perbarui informasi profil Anda</p>
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              {/* Avatar Preview */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 border-3 border-border bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-brutal text-2xl sm:text-3xl text-secondary-foreground">
                      {getInitials(fullName)}
                    </span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
                {avatarUrl && !uploading && (
                  <Button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground border-2 border-border flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Avatar Upload */}
              <div className="space-y-3 flex-1 w-full">
                <Label className="font-brutal text-xs tracking-wider">FOTO PROFIL</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading || saving}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || saving}
                  className="w-fit px-4 h-5"
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? "MENGUPLOAD..." : "PILIH FOTO"}
                </Button>
                <p className="text-xs font-mono text-muted-foreground">
                  Format: JPG, PNG, GIF, WEBP. Maks 2MB.
                </p>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-brutal text-xs tracking-wider">EMAIL</Label>
              <Input
                id="email"
                type="email"
                value={userData?.email || ""}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs font-mono text-muted-foreground">
                Email tidak dapat diubah
              </p>
            </div>

            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-brutal text-xs tracking-wider">
                NAMA LENGKAP <span className="text-muted-foreground">(OPSIONAL)</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs font-mono text-muted-foreground">
                Nama akan ditampilkan di profil Anda
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={saving || uploading} className="w-full sm:w-auto">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                SIMPAN
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={saving || uploading}
                className="w-full sm:w-auto"
              >
                BATAL
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
