import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar, FileText, Loader2, Users, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UploadHistory {
  id: string;
  file_name: string;
  uploaded_at: string;
  customers_count: number;
  transactions_count: number;
}

const History = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [hasOrphanedData, setHasOrphanedData] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [location.key]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      await loadUploadHistory();
      await checkOrphanedData();
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

  const loadUploadHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("upload_history")
        .select("*")
        .eq("user_id", session.user.id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setUploadHistory(data || []);
    } catch (error: any) {
      toast({
        title: "Gagal memuat riwayat",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const checkOrphanedData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", session.user.id)
        .is("upload_id", null)
        .limit(1);

      if (error) throw error;
      setHasOrphanedData((data || []).length > 0);
    } catch (error: any) {
      console.error("Error checking orphaned data:", error);
    }
  };

  const handleDeleteHistory = async (historyId: string) => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error: transError } = await supabase
        .from("transactions")
        .delete()
        .eq("upload_id", historyId)
        .eq("user_id", session.user.id);

      if (transError) throw transError;

      const { error: segError } = await supabase
        .from("customer_segments")
        .delete()
        .eq("upload_id", historyId)
        .eq("user_id", session.user.id);

      if (segError) throw segError;

      const { error: histError } = await supabase
        .from("upload_history")
        .delete()
        .eq("id", historyId)
        .eq("user_id", session.user.id);

      if (histError) throw histError;

      toast({
        title: "Berhasil!",
        description: "Data berhasil dihapus.",
      });

      await loadUploadHistory();
      await checkOrphanedData();
    } catch (error: any) {
      toast({
        title: "Gagal menghapus",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteAllData = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error: transError } = await supabase
        .from("transactions")
        .delete()
        .eq("user_id", session.user.id);

      if (transError) throw transError;

      const { error: segError } = await supabase
        .from("customer_segments")
        .delete()
        .eq("user_id", session.user.id);

      if (segError) throw segError;

      const { error: histError } = await supabase
        .from("upload_history")
        .delete()
        .eq("user_id", session.user.id);

      if (histError) throw histError;

      toast({
        title: "Berhasil!",
        description: "Semua data berhasil dihapus.",
      });

      await loadUploadHistory();
      await checkOrphanedData();
    } catch (error: any) {
      toast({
        title: "Gagal menghapus",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteAllDialogOpen(false);
    }
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
      <div className="border-3 border-border p-4 sm:p-6 bg-foreground text-background shadow-brutal">
        <h1 className="text-2xl sm:text-4xl font-brutal mb-2">RIWAYAT UPLOAD</h1>
        <p className="font-mono text-sm text-background/70">Kelola riwayat upload data Anda</p>
      </div>

      {/* Main Card */}
      <div className="border-3 border-border bg-card shadow-brutal">
        {/* Card Header */}
        <div className="p-4 sm:p-6 border-b-3 border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-brutal">RIWAYAT UPLOAD DATA</h2>
            <p className="font-mono text-sm text-muted-foreground">Daftar file yang pernah Anda upload</p>
          </div>
          {(uploadHistory.length > 0 || hasOrphanedData) && (
            <Button
              variant="destructive"
              onClick={() => setDeleteAllDialogOpen(true)}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              HAPUS SEMUA
            </Button>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-6">
          {uploadHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-3 border-border bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              {hasOrphanedData ? (
                <div className="space-y-2">
                  <p className="font-brutal">TIDAK ADA RIWAYAT UPLOAD</p>
                  <p className="font-mono text-sm text-muted-foreground">
                    Ada data lama di sistem. Gunakan "Hapus Semua" untuk menghapus.
                  </p>
                </div>
              ) : (
                <p className="font-mono text-muted-foreground">Belum ada riwayat upload</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {uploadHistory.map((history) => (
                <div
                  key={history.id}
                  className="border-3 border-border p-4 bg-card hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* File Icon */}
                    <div className="w-12 h-12 border-3 border-border bg-secondary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-brutal text-sm sm:text-base truncate">{history.file_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm font-mono text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {format(new Date(history.uploaded_at), "dd MMM yyyy", { locale: idLocale })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          {history.customers_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                          {history.transactions_count}
                        </span>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedHistoryId(history.id);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={deleting}
                      className="self-end sm:self-center flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Single Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-3 border-border shadow-brutal-lg mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-brutal">HAPUS RIWAYAT UPLOAD?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-sm">
              Tindakan ini akan menghapus semua data yang terkait dengan upload ini, termasuk transaksi dan segmentasi customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleting} className="w-full sm:w-auto">BATAL</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedHistoryId && handleDeleteHistory(selectedHistoryId)}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              HAPUS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent className="border-3 border-border shadow-brutal-lg mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-brutal">HAPUS SEMUA DATA?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-sm">
              Tindakan ini akan menghapus SEMUA data Anda termasuk transaksi, segmentasi customer, dan riwayat upload.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleting} className="w-full sm:w-auto">BATAL</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllData}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              HAPUS SEMUA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default History;
