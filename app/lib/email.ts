import nodemailer from "nodemailer";

function criarTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function enviarEmailSolicitacaoRecebida(para: string, nome: string) {
  const transporter = criarTransporter();
  if (!transporter) {
    console.log(`[Email] SMTP não configurado. Email de recebimento para ${para} não enviado.`);
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f8f5ff;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#6001D3;font-size:28px;margin:0;">Mundo Gestão</h1>
      </div>
      <div style="background:#fff;border-radius:12px;padding:32px;">
        <h2 style="color:#111;margin-top:0;">Olá, ${nome}! Recebemos sua solicitação.</h2>
        <p style="color:#444;line-height:1.6;">
          Recebemos sua solicitação de cadastro como vendedor na plataforma <strong>Mundo Gestão</strong>.
          Nossa equipe irá analisar as informações enviadas e você receberá uma resposta em breve.
        </p>
        <div style="background:#f0e8ff;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#6001D3;font-weight:700;">⏳ O que acontece agora?</p>
          <ul style="color:#444;line-height:1.8;margin:10px 0 0;padding-left:18px;">
            <li>Nossa equipe analisará seu cadastro</li>
            <li>Você receberá um e-mail de aprovação ou recusa</li>
            <li>Em caso de aprovação, receberá suas credenciais de acesso</li>
          </ul>
        </div>
        <p style="color:#888;font-size:13px;margin-bottom:0;">Se tiver dúvidas, entre em contato conosco respondendo este e-mail.</p>
      </div>
      <p style="text-align:center;color:#aaa;font-size:12px;margin-top:20px;">Mundo Gestão &mdash; ISO Consulting Platform</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Mundo Gestão" <${process.env.SMTP_USER}>`,
    to: para,
    subject: "📋 Recebemos sua solicitação de cadastro - Mundo Gestão",
    html,
  });
}

export async function enviarEmailRejeicaoVendedor(para: string, nome: string, motivo: string) {
  const transporter = criarTransporter();
  if (!transporter) {
    console.log(`[Email] SMTP não configurado. Email de rejeição para ${para} não enviado.`);
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f8f5ff;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#6001D3;font-size:28px;margin:0;">Mundo Gestão</h1>
      </div>
      <div style="background:#fff;border-radius:12px;padding:32px;">
        <h2 style="color:#111;margin-top:0;">Olá, ${nome}.</h2>
        <p style="color:#444;line-height:1.6;">
          Após análise, infelizmente não foi possível aprovar sua solicitação de cadastro como vendedor na plataforma <strong>Mundo Gestão</strong>.
        </p>
        <div style="background:#fff5f5;border-left:4px solid #EF4444;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 6px;font-weight:700;color:#B91C1C;">Motivo:</p>
          <p style="margin:0;color:#444;line-height:1.6;">${motivo}</p>
        </div>
        <p style="color:#444;line-height:1.6;">
          Se acredita que houve um engano ou deseja enviar novas informações, entre em contato respondendo este e-mail.
        </p>
      </div>
      <p style="text-align:center;color:#aaa;font-size:12px;margin-top:20px;">Mundo Gestão &mdash; ISO Consulting Platform</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Mundo Gestão" <${process.env.SMTP_USER}>`,
    to: para,
    subject: "❌ Solicitação de cadastro não aprovada - Mundo Gestão",
    html,
  });
}

export async function enviarEmailAprovacaoVendedor(para: string, nome: string) {
  const transporter = criarTransporter();
  if (!transporter) {
    console.log(`[Email] SMTP não configurado. Email de aprovação para ${para} não enviado.`);
    return;
  }

  const url = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f8f5ff;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#6001D3;font-size:28px;margin:0;">Mundo Gestão</h1>
      </div>
      <div style="background:#fff;border-radius:12px;padding:32px;">
        <h2 style="color:#111;margin-top:0;">Parabéns, ${nome}! Sua conta foi aprovada.</h2>
        <p style="color:#444;line-height:1.6;">Seu cadastro como vendedor na plataforma <strong>Mundo Gestão</strong> foi aprovado e já está ativo.</p>
        <div style="background:#f0e8ff;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 8px;font-weight:700;color:#6001D3;">Dados de acesso:</p>
          <p style="margin:4px 0;color:#333;"><strong>Login:</strong> ${para}</p>
          <p style="margin:4px 0;color:#333;"><strong>Senha provisória:</strong> senha@123</p>
        </div>
        <p style="color:#e67e00;font-size:13px;background:#fff8e6;padding:10px 14px;border-radius:8px;border-left:4px solid #e67e00;">
          ⚠️ No primeiro acesso você será solicitado a criar uma nova senha pessoal.
        </p>
        <div style="text-align:center;margin-top:28px;">
          <a href="${url}/login" style="display:inline-block;background:#6001D3;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Acessar plataforma</a>
        </div>
      </div>
      <p style="text-align:center;color:#aaa;font-size:12px;margin-top:20px;">Mundo Gestão &mdash; ISO Consulting Platform</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Mundo Gestão" <${process.env.SMTP_USER}>`,
    to: para,
    subject: "✅ Sua conta foi aprovada! - Mundo Gestão",
    html,
  });
}
