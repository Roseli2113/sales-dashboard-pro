import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Camera, Save } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, phone, avatar_url").eq("user_id", user.id).single().then(async ({ data }) => {
      setName(data?.display_name ?? "");
      setPhone((data as any)?.phone ?? "");
      setAvatarPath(data?.avatar_url ?? null);
      if (data?.avatar_url) {
        const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(data.avatar_url, 3600);
        setAvatarUrl(signed?.signedUrl ?? null);
      }
    });
  }, [user]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error("Erro ao subir foto");
    setAvatarPath(path);
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    setAvatarUrl(data?.signedUrl ?? null);
    await supabase.from("profiles").update({ avatar_url: path }).eq("user_id", user.id);
    toast.success("Foto atualizada");
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await (supabase as any).from("profiles").update({ display_name: name, phone, avatar_url: avatarPath }).eq("user_id", user.id);
    if (error) toast.error("Erro ao salvar perfil");
    else toast.success("Perfil salvo");
  };

  const updatePassword = async () => {
    if (password.length < 6) return toast.error("A senha precisa ter pelo menos 6 caracteres");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error("Erro ao alterar senha");
    else {
      setPassword("");
      toast.success("Senha alterada");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
          <p className="text-sm text-muted-foreground">Edite seus dados, foto e senha.</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20"><AvatarImage src={avatarUrl ?? undefined} /><AvatarFallback>{user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            <div>
              <Label htmlFor="avatar" className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm hover:bg-secondary"><Camera className="mr-2 h-4 w-4" /> Subir foto</Label>
              <Input id="avatar" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
            <div><Label>Celular</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
            <Button onClick={saveProfile} className="w-fit"><Save className="mr-2 h-4 w-4" /> Salvar perfil</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold text-card-foreground">Alterar senha</h2>
          <div className="mt-4 flex gap-2">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha" />
            <Button onClick={updatePassword}>Atualizar</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
