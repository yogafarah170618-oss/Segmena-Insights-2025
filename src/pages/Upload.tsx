import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileText, CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/auth");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      toast.success("File uploaded successfully!");
    } else {
      toast.error("Please upload a CSV file");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);
      toast.success("File uploaded successfully!");
    } else {
      toast.error("Please upload a CSV file");
    }
  };

  const handleProcess = async () => {
    if (!file) {
      toast.error("Please upload a file first");
      return;
    }
    
    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Silakan login terlebih dahulu");
        navigate("/auth");
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      // Use Vercel API route instead of Supabase Edge Function
      const response = await fetch('/api/process-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process CSV');
      }

      toast.success(`Berhasil! ${data.stats?.customers_segmented || 0} customer di-segmentasi`);
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Gagal memproses file. Pastikan format CSV sesuai.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 dotted-bg overflow-x-hidden">
      <div className="max-w-4xl w-full space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="text-center px-2">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-brutal mb-2 sm:mb-4">UPLOAD DATA</h1>
          <div className="inline-block bg-secondary px-3 sm:px-4 py-1 border-3 border-border shadow-brutal rotate-1">
            <span className="font-mono text-secondary-foreground text-xs sm:text-sm">CUSTOMER TRANSACTIONS</span>
          </div>
          <p className="font-mono text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-6 max-w-xl mx-auto">
            Upload transaksi pelanggan dalam format CSV untuk mendapatkan insight mendalam
          </p>
        </div>

        {/* Upload Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-3 border-border bg-card shadow-brutal p-6 sm:p-12 transition-all mx-1 sm:mx-0 ${
            isDragging ? "translate-x-[-2px] translate-y-[-2px] shadow-brutal-lg bg-secondary/10" : ""
          }`}
        >
          <div className="text-center">
            {!file ? (
              <>
                <div className="w-16 h-16 sm:w-24 sm:h-24 border-3 border-border bg-foreground text-background flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <UploadIcon className="w-8 h-8 sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-lg sm:text-2xl font-brutal mb-1 sm:mb-2">DROP YOUR CSV FILE HERE</h3>
                <p className="font-mono text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-8">or tap to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild className="text-sm sm:text-base">
                    <span>BROWSE FILES</span>
                  </Button>
                </label>
              </>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="w-16 h-16 sm:w-24 sm:h-24 border-3 border-border bg-secondary flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-secondary-foreground" />
                </div>
                <div className="border-3 border-border p-3 sm:p-4 flex items-center justify-between bg-card gap-2">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-border flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-brutal text-sm sm:text-base truncate">{file.name}</div>
                      <div className="text-xs sm:text-sm font-mono text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setFile(null)}
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Format Info */}
        <div className="border-3 border-border bg-card shadow-brutal p-4 sm:p-8 mx-1 sm:mx-0">
          <h3 className="text-base sm:text-xl font-brutal mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-3 border-border">FORMAT DATA YANG DIPERLUKAN</h3>
          <div className="space-y-3 sm:space-y-4 font-mono text-xs sm:text-sm">
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-foreground text-background flex items-center justify-center text-[10px] sm:text-xs font-brutal flex-shrink-0">1</div>
              <div className="flex flex-wrap items-center gap-1">
                <strong className="font-brutal">customer_id:</strong>
                <span className="text-muted-foreground">ID unik</span>
                <span className="bg-accent text-accent-foreground px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">WAJIB</span>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-foreground text-background flex items-center justify-center text-[10px] sm:text-xs font-brutal flex-shrink-0">2</div>
              <div className="flex flex-wrap items-center gap-1">
                <strong className="font-brutal">transaction_date:</strong>
                <span className="text-muted-foreground hidden sm:inline">(YYYY-MM-DD)</span>
                <span className="bg-accent text-accent-foreground px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">WAJIB</span>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-foreground text-background flex items-center justify-center text-[10px] sm:text-xs font-brutal flex-shrink-0">3</div>
              <div className="flex flex-wrap items-center gap-1">
                <strong className="font-brutal">transaction_amount:</strong>
                <span className="text-muted-foreground hidden sm:inline">(angka)</span>
                <span className="bg-accent text-accent-foreground px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">WAJIB</span>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] sm:text-xs font-brutal flex-shrink-0">4</div>
              <div className="flex flex-wrap items-center gap-1">
                <strong className="font-brutal">customer_name:</strong>
                <span className="text-muted-foreground">Nama</span>
                <span className="bg-muted px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">OPSIONAL</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 border-3 border-border bg-muted overflow-x-auto">
            <p className="text-xs sm:text-sm font-brutal mb-2 sm:mb-3">CONTOH FORMAT CSV:</p>
            <code className="text-[10px] sm:text-xs block whitespace-pre font-mono leading-relaxed">
customer_id,transaction_date,transaction_amount,customer_name{'\n'}
CUST001,2024-01-15,500000,Ahmad Wijaya{'\n'}
CUST002,2024-01-16,750000,{'\n'}
CUST003,2024-01-17,250000,Siti Nurhaliza
            </code>
          </div>
        </div>

        {/* Process Button */}
        {file && (
          <div className="text-center px-1 sm:px-0">
            <Button
              size="lg"
              onClick={handleProcess}
              disabled={isProcessing}
              className="text-sm sm:text-lg px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  PROCESSING...
                </>
              ) : (
                "PROCESS DATA"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
