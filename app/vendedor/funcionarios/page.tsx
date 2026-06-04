"use client";

import { useState, useEffect } from "react";
import VendedorSidebar from "@/app/components/layout/VendedorSidebar";
import {
  listarFuncionarios,
  adicionarFuncionario,
  atualizarFuncionario,
  removerFuncionario,
  criarContaFuncionario,
  removerContaFuncionario,
} from "@/app/actions/funcionarios";

type Funcionario = {
  id: number;
  nome: string;
  cargo: string | null;
  email: string | null;
  ativo: boolean;
  createdAt: string;
  LinkedUser: { id: string; login: string; trocarSenha: boolean } | null;
};

type ModalTipo = "adicionar" | "editar" | "confirmarRemover" | "credenciais" | null;

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(80,0,160,0.2)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}

function CampoTexto({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: "10px", fontSize: "14px", color: "#111", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
        onFocus={(e) => { e.target.style.borderColor = "#7B00D4"; }}
        onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; }}
      />
    </div>
  );
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalTipo>(null);
  const [selecionado, setSelecionado] = useState<Funcionario | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [credenciais, setCredenciais] = useState<{ login: string; senha: string } | null>(null);

  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");

  const carregar = async () => {
    const res = await listarFuncionarios();
    if (res.success) setFuncionarios(res.funcionarios as any);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const abrirAdicionar = () => {
    setNome(""); setCargo(""); setEmail(""); setErro("");
    setModal("adicionar");
  };

  const abrirEditar = (f: Funcionario) => {
    setSelecionado(f);
    setNome(f.nome); setCargo(f.cargo ?? ""); setEmail(f.email ?? ""); setErro("");
    setModal("editar");
  };

  const fechar = () => { setModal(null); setSelecionado(null); setErro(""); setCredenciais(null); };

  const handleAdicionar = async () => {
    if (!nome.trim()) { setErro("O nome é obrigatório."); return; }
    setProcessando(true);
    const res = await adicionarFuncionario({ nome, cargo: cargo || undefined, email: email || undefined });
    setProcessando(false);
    if (!res.success) { setErro(res.error || "Erro ao adicionar."); return; }
    fechar();
    carregar();
  };

  const handleEditar = async () => {
    if (!nome.trim()) { setErro("O nome é obrigatório."); return; }
    if (!selecionado) return;
    setProcessando(true);
    const res = await atualizarFuncionario(selecionado.id, { nome, cargo, email });
    setProcessando(false);
    if (!res.success) { setErro(res.error || "Erro ao atualizar."); return; }
    fechar();
    carregar();
  };

  const handleToggleAtivo = async (f: Funcionario) => {
    await atualizarFuncionario(f.id, { ativo: !f.ativo });
    carregar();
  };

  const handleRemover = async () => {
    if (!selecionado) return;
    setProcessando(true);
    await removerFuncionario(selecionado.id);
    setProcessando(false);
    fechar();
    carregar();
  };

  const handleCriarConta = async (f: Funcionario) => {
    setSelecionado(f);
    setProcessando(true);
    const res = await criarContaFuncionario(f.id);
    setProcessando(false);
    if (!res.success) {
      alert(res.error || "Erro ao criar conta.");
      return;
    }
    setCredenciais({ login: res.login!, senha: res.senhaTemporaria! });
    setModal("credenciais");
    carregar();
  };

  const handleRemoverConta = async (f: Funcionario) => {
    if (!confirm(`Remover acesso à plataforma de ${f.nome}? O login será desativado.`)) return;
    setProcessando(true);
    const res = await removerContaFuncionario(f.id);
    setProcessando(false);
    if (!res.success) { alert(res.error || "Erro ao remover conta."); return; }
    carregar();
  };

  const ativos = funcionarios.filter((f) => f.ativo);
  const inativos = funcionarios.filter((f) => !f.ativo);

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Equipe</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>
            Gerencie os funcionários e seus acessos à plataforma
          </p>
        </div>
        <button
          onClick={abrirAdicionar}
          style={{ background: "#fff", color: "#6001D3", padding: "12px 28px", borderRadius: "12px", fontWeight: 800, fontSize: "15px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span> Novo Funcionário
        </button>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <VendedorSidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>

          {/* Cards de resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {[
              { label: "Total de funcionários", value: funcionarios.length, color: "#6001D3", bg: "#EDE9FE" },
              { label: "Ativos", value: ativos.length, color: "#059669", bg: "#DCFCE7" },
              { label: "Inativos", value: inativos.length, color: "#9CA3AF", bg: "#F3F4F6" },
              { label: "Com conta ativa", value: funcionarios.filter((f) => f.LinkedUser).length, color: "#0891B2", bg: "#E0F2FE" },
            ].map((c) => (
              <div key={c.label} style={{ background: "#fff", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 4px 16px rgba(80,0,160,0.08)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: c.color }}>{c.value}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Lista principal */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", flex: 1 }}>
            {loading ? (
              <p style={{ color: "#888", textAlign: "center", paddingTop: "40px" }}>Carregando...</p>
            ) : funcionarios.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: "60px", paddingBottom: "60px" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>👥</div>
                <p style={{ color: "#374151", fontSize: "17px", fontWeight: 700, margin: "0 0 8px" }}>Nenhum funcionário cadastrado</p>
                <p style={{ color: "#9CA3AF", fontSize: "14px", margin: "0 0 28px" }}>
                  Adicione os membros da sua equipe para gerenciar acessos e chats.
                </p>
                <button
                  onClick={abrirAdicionar}
                  style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", padding: "12px 32px", borderRadius: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  Adicionar primeiro funcionário
                </button>
              </div>
            ) : (
              <div>
                {ativos.length > 0 && (
                  <div style={{ marginBottom: inativos.length > 0 ? "32px" : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Ativos · {ativos.length}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {ativos.map((f) => (
                        <CartaoFuncionario
                          key={f.id}
                          funcionario={f}
                          processando={processando}
                          onEditar={() => abrirEditar(f)}
                          onToggleAtivo={() => handleToggleAtivo(f)}
                          onRemover={() => { setSelecionado(f); setModal("confirmarRemover"); }}
                          onCriarConta={() => handleCriarConta(f)}
                          onRemoverConta={() => handleRemoverConta(f)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {inativos.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#D1D5DB", display: "inline-block" }} />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Inativos · {inativos.length}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {inativos.map((f) => (
                        <CartaoFuncionario
                          key={f.id}
                          funcionario={f}
                          processando={processando}
                          onEditar={() => abrirEditar(f)}
                          onToggleAtivo={() => handleToggleAtivo(f)}
                          onRemover={() => { setSelecionado(f); setModal("confirmarRemover"); }}
                          onCriarConta={() => handleCriarConta(f)}
                          onRemoverConta={() => handleRemoverConta(f)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Adicionar / Editar */}
      {(modal === "adicionar" || modal === "editar") && (
        <Overlay onClose={fechar}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginTop: 0, marginBottom: "8px", color: "#111" }}>
            {modal === "adicionar" ? "Novo Funcionário" : "Editar Funcionário"}
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 24px" }}>
            {modal === "adicionar"
              ? "Preencha os dados do funcionário. Depois, crie a conta para ele acessar a plataforma."
              : "Atualize as informações do funcionário."}
          </p>

          <CampoTexto label="Nome completo *" value={nome} onChange={setNome} placeholder="Ex: Pedro Souza" />
          <CampoTexto label="Cargo" value={cargo} onChange={setCargo} placeholder="Ex: Auditor Líder, Consultor ISO 9001..." />
          <CampoTexto label="E-mail" value={email} onChange={setEmail} placeholder="pedro@empresa.com.br" type="email" />

          {erro && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "10px 14px", color: "#B91C1C", fontSize: "13px", marginBottom: "16px" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button onClick={fechar} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid #E5E7EB", borderRadius: "12px", fontWeight: 600, cursor: "pointer", color: "#374151", fontSize: "14px" }}>
              Cancelar
            </button>
            <button
              onClick={modal === "adicionar" ? handleAdicionar : handleEditar}
              disabled={processando}
              style={{ flex: 2, padding: "12px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", fontSize: "14px", opacity: processando ? 0.7 : 1 }}
            >
              {processando ? "Salvando..." : modal === "adicionar" ? "Adicionar Funcionário" : "Salvar Alterações"}
            </button>
          </div>
        </Overlay>
      )}

      {/* Modal Confirmar Remoção */}
      {modal === "confirmarRemover" && selecionado && (
        <Overlay onClose={fechar}>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>
              🗑️
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111", marginBottom: "10px" }}>Remover funcionário?</h2>
            <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "8px" }}>
              Você está prestes a remover <strong>{selecionado.nome}</strong>
              {selecionado.cargo && ` (${selecionado.cargo})`} da sua equipe.
            </p>
            {selecionado.LinkedUser && (
              <p style={{ color: "#B91C1C", fontSize: "13px", marginBottom: "8px", background: "#FEF2F2", padding: "10px 14px", borderRadius: "10px" }}>
                A conta de acesso <strong>{selecionado.LinkedUser.login}</strong> também será removida.
              </p>
            )}
            <p style={{ color: "#9CA3AF", fontSize: "12px", marginBottom: "28px" }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={fechar} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid #E5E7EB", borderRadius: "12px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                Cancelar
              </button>
              <button
                onClick={handleRemover}
                disabled={processando}
                style={{ flex: 1, padding: "12px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", opacity: processando ? 0.7 : 1 }}
              >
                {processando ? "Removendo..." : "Sim, remover"}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Modal Credenciais */}
      {modal === "credenciais" && credenciais && selecionado && (
        <Overlay onClose={fechar}>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>
              🔑
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111", marginBottom: "8px" }}>Conta criada!</h2>
            <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "24px" }}>
              Compartilhe as credenciais abaixo com <strong>{selecionado.nome}</strong>. No primeiro acesso, será solicitada a troca de senha.
            </p>

            <div style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: "14px", padding: "20px", textAlign: "left", marginBottom: "20px" }}>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Login</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#111", fontFamily: "monospace", background: "#fff", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E5E7EB" }}>
                  {credenciais.login}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Senha temporária</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#111", fontFamily: "monospace", background: "#fff", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E5E7EB" }}>
                  {credenciais.senha}
                </div>
              </div>
            </div>

            <p style={{ color: "#9CA3AF", fontSize: "12px", marginBottom: "24px" }}>
              O funcionário só terá acesso aos chats que você atribuir a ele.
            </p>

            <button
              onClick={fechar}
              style={{ width: "100%", padding: "12px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
            >
              Entendi
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function CartaoFuncionario({
  funcionario: f,
  processando,
  onEditar,
  onToggleAtivo,
  onRemover,
  onCriarConta,
  onRemoverConta,
}: {
  funcionario: Funcionario;
  processando: boolean;
  onEditar: () => void;
  onToggleAtivo: () => void;
  onRemover: () => void;
  onCriarConta: () => void;
  onRemoverConta: () => void;
}) {
  const temConta = !!f.LinkedUser;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "14px 16px", border: "1.5px solid #F3F4F6", borderRadius: "14px",
        opacity: f.ativo ? 1 : 0.55, transition: "opacity 0.2s",
      }}
    >
      <AvatarLetra nome={f.nome} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#111", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {f.nome}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {f.cargo && (
            <span style={{ fontSize: "12px", color: "#6001D3", fontWeight: 600, background: "#EDE9FE", padding: "2px 8px", borderRadius: "20px" }}>
              {f.cargo}
            </span>
          )}
          {f.email && (
            <span style={{ fontSize: "12px", color: "#6B7280" }}>{f.email}</span>
          )}
          {/* Badge de conta */}
          {temConta ? (
            <span style={{ fontSize: "11px", fontWeight: 700, background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>●</span> {f.LinkedUser!.login}
              {f.LinkedUser!.trocarSenha && (
                <span style={{ fontWeight: 600, color: "#92400E", background: "#FEF3C7", padding: "1px 6px", borderRadius: "8px", fontSize: "10px" }}>
                  1º acesso pendente
                </span>
              )}
            </span>
          ) : (
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: "20px" }}>
              Sem conta
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        {/* Criar / remover conta */}
        {!temConta ? (
          <button
            onClick={onCriarConta}
            disabled={processando}
            title="Criar conta de acesso"
            style={{
              padding: "7px 14px", borderRadius: "10px", border: "1.5px solid #6001D3",
              background: "#F5F0FF", cursor: "pointer", fontSize: "12px", fontWeight: 700,
              color: "#6001D3", transition: "all 0.2s", opacity: processando ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            + Criar conta
          </button>
        ) : (
          <button
            onClick={onRemoverConta}
            title="Remover acesso à plataforma"
            style={{
              padding: "7px 14px", borderRadius: "10px", border: "1.5px solid #FECACA",
              background: "#FEF2F2", cursor: "pointer", fontSize: "12px", fontWeight: 700,
              color: "#DC2626", transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            Revogar acesso
          </button>
        )}

        {/* Toggle ativo */}
        <button
          onClick={onToggleAtivo}
          title={f.ativo ? "Desativar" : "Reativar"}
          style={{
            width: "36px", height: "36px", borderRadius: "10px", border: "1.5px solid",
            borderColor: f.ativo ? "#22C55E33" : "#D1D5DB",
            background: f.ativo ? "#F0FDF4" : "#F9FAFB",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "15px", transition: "all 0.2s",
          }}
        >
          {f.ativo ? "✓" : "○"}
        </button>

        {/* Editar */}
        <button
          onClick={onEditar}
          title="Editar"
          style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1.5px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}
        >
          ✎
        </button>

        {/* Remover */}
        <button
          onClick={onRemover}
          title="Remover"
          style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1.5px solid #FECACA", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#EF4444" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function AvatarLetra({ nome, size = 44 }: { nome: string; size?: number }) {
  const cores = ["#6001D3", "#0891B2", "#059669", "#D97706", "#DC2626", "#7C3AED"];
  const cor = cores[nome.charCodeAt(0) % cores.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: cor + "1A", border: `2px solid ${cor}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: size * 0.38, fontWeight: 800, color: cor }}>
      {nome[0].toUpperCase()}
    </div>
  );
}
