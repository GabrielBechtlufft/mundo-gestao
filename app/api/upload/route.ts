import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "application/pdf") {
    return buffer.slice(0, 4).toString("ascii") === "%PDF";
  }
  if (mimeType === "image/png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/webp") {
    return (
      buffer.slice(0, 4).toString("ascii") === "RIFF" &&
      buffer.slice(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Tipo de arquivo não permitido. Envie PDF, PNG, JPG ou WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Arquivo muito grande. Tamanho máximo: 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: "Conteúdo do arquivo não corresponde ao tipo informado." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    const fileName = `${randomUUID()}${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${fileName}`, buffer, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ success: true, url: blob.url });
    }

    // Fallback: salva no filesystem local (desenvolvimento)
    const { writeFile } = await import("fs/promises");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await writeFile(path.join(uploadDir, fileName), buffer);
    return NextResponse.json({ success: true, url: `/uploads/${fileName}` });

  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar upload." },
      { status: 500 }
    );
  }
}
