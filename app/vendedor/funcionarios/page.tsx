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
      style={{ position: "fixed", inset: 0, background: "rgba(2,13,29,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "480px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto", color: "#FFFFFF" }}
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
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#E8EDF0", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid rgba(232, 237, 240, 0.18)", borderRadius: "10px", fontSize: "14px", color: "#FFFFFF", background: "#020D1D", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
        onFocus={(e) => { e.target.style.borderColor = "#00EBCB"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(232, 237, 240, 0.18)"; }}
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
  const [busca, setBusca] = useState("");

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

  const funcionariosFiltrados = funcionarios.filter((f) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return [f.nome, f.cargo, f.email].join(" ").toLowerCase().includes(q);
  });
  const ativos = funcionariosFiltrados.filter((f) => f.ativo);
  const inativos = funcionariosFiltrados.filter((f) => !f.ativo);

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column", fontFamily: "var(--font-montserrat), sans-serif", color: "#FFFFFF" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <div>
          <h1 style={{ color: "#FFFFFF", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Equipe</h1>
          <p style={{ color: "#A7B0B8", fontSize: "14px", margin: 0, fontWeight: 400 }}>
            Gerencie os funcionários e seus acessos à plataforma
          </p>
        </div>
        <button
          onClick={abrirAdicionar}
          style={{ background: "#00EBCB", color: "#020D1D", padding: "12px 28px", borderRadius: "12px", fontWeight: 600, fontSize: "15px", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,235,203,0.3)", display: "flex", alignItems: "center", gap: "8px" }}
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
              { label: "Total de funcionários", value: funcionarios.length, color: "#00EBCB", bg: "rgba(0, 235, 203, 0.15)" },
              { label: "Ativos", value: ativos.length, color: "#22C55E", bg: "rgba(34, 197, 94, 0.15)" },
              { label: "Inativos", value: inativos.length, color: "#A7B0B8", bg: "rgba(232, 237, 240, 0.1)" },
              { label: "Com conta ativa", value: funcionarios.filter((f) => f.LinkedUser).length, color: "#00A9D6", bg: "rgba(0, 169, 214, 0.15)" },
            ].map((c) => (
              <div key={c.label} style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: c.color }}>{c.value}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#E8EDF0", lineHeight: 1.3 }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Lista principal */}
          <div style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", flex: 1 }}>
            {funcionarios.length > 0 && (
              <input
                type="text"
                placeholder="Buscar por nome, cargo ou e-mail..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ padding: "12px 16px", borderRadius: "10px", border: "1.5px solid rgba(232, 237, 240, 0.18)", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box", color: "#FFFFFF", background: "#020D1D", marginBottom: "20px" }}
              />
            )}
            {loading ? (
              <p style={{ color: "#00EBCB", textAlign: "center", paddingTop: "40px", fontWeight: 500 }}>Carregando...</p>
            ) : funcionariosFiltrados.length === 0 && busca ? (
              <p style={{ textAlign: "center", color: "#A7B0B8", fontSize: "14px", padding: "32px 0" }}>Nenhum funcionário encontrado para esta busca.</p>
            ) : funcionarios.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: "60px", paddingBottom: "60px" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>👥</div>
                <p style={{ color: "#FFFFFF", fontSize: "17px", fontWeight: 700, margin: "0 0 8px" }}>Nenhum funcionário cadastrado</p>
                <p style={{ color: "#A7B0B8", fontSize: "14px", margin: "0 0 28px" }}>
                  Adicione os membros da sua equipe para gerenciar acessos e chats.
                </p>
                <button
                  onClick={abrirAdicionar}
                  style={{ background: "#00EBCB", color: "#020D1D", padding: "12px 32px", borderRadius: "12px", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,235,203,0.3)" }}
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
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#A7B0B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "10px 14px", color: "#F87171", fontSize: "13px", marginBottom: "16px" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button onClick={fechar} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid rgba(232, 237, 240, 0.2)", borderRadius: "12px", fontWeight: 600, cursor: "pointer", color: "#E8EDF0", fontSize: "14px" }}>
              Cancelar
            </button>
            <button
              onClick={modal === "adicionar" ? handleAdicionar : handleEditar}
              disabled={processando}
              style={{ flex: 2, padding: "12px", background: "#00EBCB", color: "#020D1D", border: "none", borderRadius: "12px", fontWeight: 600, cursor: "pointer", fontSize: "14px", opacity: processando ? 0.7 : 1, boxShadow: "0 4px 14px rgba(0,235,203,0.3)" }}
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
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>
              🗑️
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "10px" }}>Remover funcionário?</h2>
            <p style={{ color: "#A7B0B8", fontSize: "14px", marginBottom: "8px" }}>
              Você está prestes a remover <strong style={{ color: "#FFFFFF" }}>{selecionado.nome}</strong>
              {selecionado.cargo && ` (${selecionado.cargo})`} da sua equipe.
            </p>
            {selecionado.LinkedUser && (
              <p style={{ color: "#F87171", fontSize: "13px", marginBottom: "8px", background: "rgba(239, 68, 68, 0.1)", padding: "10px 14px", borderRadius: "10px" }}>
                A conta de acesso <strong style={{ color: "#FFFFFF" }}>{selecionado.LinkedUser.login}</strong> também será removida.
              </p>
            )}
            <p style={{ color: "#A7B0B8", fontSize: "12px", marginBottom: "28px" }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={fechar} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid rgba(232, 237, 240, 0.2)", borderRadius: "12px", fontWeight: 600, cursor: "pointer", color: "#E8EDF0" }}>
                Cancelar
              </button>
              <button
                onClick={handleRemover}
                disabled={processando}
                style={{ flex: 1, padding: "12px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 600, cursor: "pointer", opacity: processando ? 0.7 : 1 }}
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
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>
              🔑
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>Conta criada!</h2>
            <p style={{ color: "#A7B0B8", fontSize: "14px", marginBottom: "24px" }}>
              Compartilhe as credenciais abaixo com <strong style={{ color: "#00EBCB" }}>{selecionado.nome}</strong>. No primeiro acesso, será solicitada a troca de senha.
            </p>

            <div style={{ background: "#020D1D", border: "1.5px solid rgba(232, 237, 240, 0.15)", borderRadius: "14px", padding: "20px", textAlign: "left", marginBottom: "20px" }}>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#A7B0B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Login</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", fontFamily: "monospace", background: "#03162D", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid rgba(232, 237, 240, 0.12)" }}>
                  {credenciais.login}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#A7B0B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Senha temporária</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#00EBCB", fontFamily: "monospace", background: "#03162D", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid rgba(232, 237, 240, 0.12)" }}>
                  {credenciais.senha}
                </div>
              </div>
            </div>

            <p style={{ color: "#A7B0B8", fontSize: "12px", marginBottom: "24px" }}>
              O funcionário só terá acesso aos chats que você atribuir a ele.
            </p>

            <button
              onClick={fechar}
              style={{ width: "100%", padding: "12px", background: "#00EBCB", color: "#020D1D", border: "none", borderRadius: "12px", fontWeight: 600, cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 14px rgba(0,235,203,0.3)" }}
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
        padding: "14px 16px", border: "1.5px solid rgba(232, 237, 240, 0.12)", borderRadius: "14px",
        background: "#020D1D",
        opacity: f.ativo ? 1 : 0.55, transition: "opacity 0.2s",
      }}
    >
      <AvatarLetra nome={f.nome} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {f.nome}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {f.cargo && (
            <span style={{ fontSize: "12px", color: "#00EBCB", fontWeight: 600, background: "rgba(0, 235, 203, 0.12)", border: "1px solid rgba(0, 235, 203, 0.25)", padding: "2px 8px", borderRadius: "20px" }}>
              {f.cargo}
            </span>
          )}
          {f.email && (
            <span style={{ fontSize: "12px", color: "#A7B0B8" }}>{f.email}</span>
          )}
          {/* Badge de conta */}
          {temConta ? (
            <span style={{ fontSize: "11px", fontWeight: 700, background: "rgba(34, 197, 94, 0.15)", color: "#22C55E", padding: "2px 8px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>●</span> {f.LinkedUser!.login}
              {f.LinkedUser!.trocarSenha && (
                <span style={{ fontWeight: 600, color: "#F59E0B", background: "rgba(245, 158, 11, 0.15)", padding: "1px 6px", borderRadius: "8px", fontSize: "10px" }}>
                  1º acesso pendente
                </span>
              )}
            </span>
          ) : (
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#A7B0B8", background: "rgba(232, 237, 240, 0.08)", padding: "2px 8px", borderRadius: "20px" }}>
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
              padding: "7px 14px", borderRadius: "10px", border: "1.5px solid #00EBCB",
              background: "rgba(0, 235, 203, 0.12)", cursor: "pointer", fontSize: "12px", fontWeight: 600,
              color: "#00EBCB", transition: "all 0.2s", opacity: processando ? 0.6 : 1,
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
              padding: "7px 14px", borderRadius: "10px", border: "1.5px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.1)", cursor: "pointer", fontSize: "12px", fontWeight: 600,
              color: "#F87171", transition: "all 0.2s", whiteSpace: "nowrap",
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
            borderColor: f.ativo ? "#22C55E66" : "rgba(232, 237, 240, 0.2)",
            background: f.ativo ? "rgba(34, 197, 94, 0.15)" : "transparent",
            color: f.ativo ? "#22C55E" : "#A7B0B8",
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
          style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1.5px solid rgba(232, 237, 240, 0.2)", background: "rgba(232, 237, 240, 0.08)", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}
        >
          ✎
        </button>

        {/* Remover */}
        <button
          onClick={onRemover}
          title="Remover"
          style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#F87171" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function AvatarLetra({ nome, size = 44 }: { nome: string; size?: number }) {
  const cores = ["#00EBCB", "#00A9D6", "#22C55E", "#F59E0B", "#F87171", "#00CDB8"];
  const cor = cores[nome.charCodeAt(0) % cores.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: cor + "20", border: `2px solid ${cor}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: size * 0.38, fontWeight: 800, color: cor }}>
      {nome[0].toUpperCase()}
    </div>
  );
}
