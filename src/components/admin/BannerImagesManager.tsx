import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, Link as LinkIcon, Loader2, GripVertical, ImagePlus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BannerImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export function BannerImagesManager() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [altInput, setAltInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("banner_images")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (!error && data) setBanners(data);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const addBanner = async (image_url: string, alt_text: string) => {
    const nextOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) + 1 : 0;
    const { error } = await supabase.from("banner_images").insert({
      image_url, alt_text: alt_text || null, display_order: nextOrder, is_active: true,
    });
    if (error) {
      toast({ title: "Failed to add banner", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Banner added", description: "Banner image is now live on the home page." });
    setUrlInput(""); setAltInput("");
    fetchBanners();
    return true;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("banner-images").upload(path, file, {
        cacheControl: "3600", upsert: false,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("banner-images").getPublicUrl(path);
      await addBanner(data.publicUrl, altInput);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    try { new URL(urlInput.trim()); }
    catch {
      toast({ title: "Invalid URL", description: "Please enter a valid image URL.", variant: "destructive" });
      return;
    }
    await addBanner(urlInput.trim(), altInput);
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("banner_images").update({ is_active }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setBanners(banners.map(b => b.id === id ? { ...b, is_active } : b));
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = banners.findIndex(b => b.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    const a = banners[idx], b = banners[swapIdx];
    await Promise.all([
      supabase.from("banner_images").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("banner_images").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    fetchBanners();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const banner = banners.find(b => b.id === deleteId);
    const { error } = await supabase.from("banner_images").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      // Remove from storage if it was uploaded to our bucket
      if (banner?.image_url.includes("/banner-images/")) {
        const path = banner.image_url.split("/banner-images/")[1];
        if (path) await supabase.storage.from("banner-images").remove([path]);
      }
      toast({ title: "Banner deleted" });
      fetchBanners();
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5" /> Add Banner Image</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" />Upload</TabsTrigger>
              <TabsTrigger value="url"><LinkIcon className="h-4 w-4 mr-2" />From URL</TabsTrigger>
            </TabsList>

            <div className="mb-4">
              <Label htmlFor="alt">Alt text (optional)</Label>
              <Input id="alt" value={altInput} onChange={e => setAltInput(e.target.value)} placeholder="Descriptive text for accessibility" />
            </div>

            <TabsContent value="upload">
              <Label htmlFor="file" className="block mb-2">Image file (max 5MB)</Label>
              <Input id="file" type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
              {uploading && <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</p>}
            </TabsContent>

            <TabsContent value="url">
              <Label htmlFor="url" className="block mb-2">Image URL</Label>
              <div className="flex gap-2">
                <Input id="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/image.jpg" />
                <Button onClick={handleAddUrl} disabled={!urlInput.trim()}>Add</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current Banners ({banners.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : banners.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No banners yet. Add one above to display on the home page.</p>
          ) : (
            <div className="space-y-3">
              {banners.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(b.id, -1)} disabled={i === 0}>↑</Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(b.id, 1)} disabled={i === banners.length - 1}>↓</Button>
                  </div>
                  <img src={b.image_url} alt={b.alt_text || ""} className="w-24 h-16 object-cover rounded border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.alt_text || "Untitled banner"}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.image_url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${b.id}`} className="text-xs">Active</Label>
                    <Switch id={`active-${b.id}`} checked={b.is_active} onCheckedChange={(v) => toggleActive(b.id, v)} />
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the banner from your home page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
