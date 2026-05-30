"use client";

import { useRef, useState } from "react";

interface AvatarUploadProps {
  nome: string;
  imagemAtual?: string | null;
  tamanho?: number;
  onUpload: (url: string) => void;
}

export default function AvatarUpload({ nome, imagemAtual, tamanho = 96, onUpload }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(imagemAtual ?? null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem muito grande. Máximo: 5MB.");
      return;
    }

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        onUpload(data.url);
      } else {
        setPreview(imagemAtual ?? null);
        alert(data.error || "Erro ao enviar imagem.");
      }
    } catch {
      setPreview(imagemAtual ?? null);
      alert("Erro ao enviar imagem.");
    }
    setUploading(false);
  };

  const inicial = nome ? nome.charAt(0).toUpperCase() : "?";
  const fonte = Math.round(tamanho * 0.38);

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      title="Clique para alterar a foto"
      style={{
        width: tamanho, height: tamanho, borderRadius: "50%",
        background: preview ? "transparent" : "linear-gradient(135deg,#6001D3,#A872F0)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, cursor: uploading ? "wait" : "pointer",
        position: "relative", overflow: "hidden",
        boxShadow: "0 8px 24px rgba(96,1,211,0.25)",
        border: "3px solid rgba(255,255,255,0.5)",
        transition: "opacity 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >
      {preview ? (
        <img src={preview} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: fonte, fontWeight: 800, color: "#fff" }}>{inicial}</span>
      )}

      {/* Camera overlay */}
      <div style={{
        position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: 0, transition: "opacity 0.2s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; }}
      >
        {uploading ? (
          <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>...</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={handleFile}
        style={{ display: "none" }}
      />
    </div>
  );
}