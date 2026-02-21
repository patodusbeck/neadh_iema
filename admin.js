const adminKeyInput = document.getElementById("adminKey");
const loadButton = document.getElementById("loadReports");
const refreshButton = document.getElementById("refreshReports");
const installButton = document.getElementById("installApp");
const changeKeyButton = document.getElementById("changeKey");
const authBox = document.getElementById("authBox");
const authMessage = document.getElementById("authMessage");
const summary = document.getElementById("summary");
const reportsList = document.getElementById("reportsList");

const detailOverlay = document.getElementById("detailOverlay");
const closeDetailButton = document.getElementById("closeDetail");
const detailTitle = document.getElementById("detailTitle");
const detailMeta = document.getElementById("detailMeta");
const detailDesc = document.getElementById("detailDesc");
const detailProtocol = document.getElementById("detailProtocol");

let adminKey = "";
let deferredInstallPrompt = null;
let reportsCache = [];

const STATUS_LABELS = {
  novo: "Novo",
  em_analise: "Em análise",
  em_analise_: "Em análise",
  analisando: "Em análise",
  concluido: "Concluído",
  concluído: "Concluído",
  arquivado: "Arquivado",
};

const storedKey = window.localStorage.getItem("admin_panel_key");
if (storedKey && adminKeyInput) {
  adminKey = storedKey;
  adminKeyInput.value = storedKey;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return date.toLocaleString("pt-BR");
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeStatus(value) {
  return String(value || "novo")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function getStatusLabel(value) {
  const key = normalizeStatus(value);
  return STATUS_LABELS[key] || "Novo";
}

function setAuthenticated(isAuthenticated) {
  if (!authBox || !changeKeyButton) return;
  authBox.classList.toggle("is-hidden", isAuthenticated);
  changeKeyButton.hidden = !isAuthenticated;
}

function openDetail(index) {
  const report = reportsCache[index];
  if (!report || !detailOverlay) return;

  const date = formatDate(report.createdAt);
  const status = getStatusLabel(report.status);
  const nome = report.nome || "Anônimo";
  const contato = report.contato || "Não informado";

  detailTitle.textContent = `${date} - Status: ${status}`;
  detailMeta.textContent = `Tipo: ${report.tipo} | Nome: ${nome} | Contato: ${contato}`;
  detailDesc.textContent = report.descricao || "Sem descrição.";
  detailProtocol.textContent = `Protocolo: ${report.protocol || "indisponível"}`;

  detailOverlay.classList.remove("is-hidden");
  detailOverlay.setAttribute("aria-hidden", "false");
}

function closeDetail() {
  if (!detailOverlay) return;
  detailOverlay.classList.add("is-hidden");
  detailOverlay.setAttribute("aria-hidden", "true");
}

function renderReports(reports) {
  reportsCache = Array.isArray(reports) ? reports : [];

  if (reportsCache.length === 0) {
    reportsList.innerHTML = '<article class="empty">Nenhuma denúncia encontrada.</article>';
    return;
  }

  reportsList.innerHTML = reportsCache
    .map((report, index) => {
      const date = formatDate(report.createdAt);
      const status = getStatusLabel(report.status);
      const statusClass = normalizeStatus(report.status);
      const tipo = escapeHtml(report.tipo || "Não informado");
      const name = report.nome ? escapeHtml(report.nome) : "Anônimo";
      const contato = report.contato ? escapeHtml(report.contato) : "Não informado";
      const descricao = escapeHtml(report.descricao || "Sem descrição");
      const protocolo = escapeHtml(report.protocol || "indisponível");

      return `
        <article class="report-card" data-index="${index}" tabindex="0" role="button" aria-label="Abrir detalhes da denúncia">
          <p class="row-top">
            <span class="when">${date}</span>
            <span class="status-pill status-${statusClass}">${escapeHtml(status)}</span>
          </p>
          <p class="meta"><strong>Tipo:</strong> ${tipo} <span class="dot">•</span> <strong>Protocolo:</strong> ${protocolo}</p>
          <p class="meta"><strong>Nome:</strong> ${name} | <strong>Contato:</strong> ${contato}</p>
          <p class="desc">${descricao}</p>
        </article>
      `;
    })
    .join("");
}

async function fetchReports() {
  if (!adminKey) {
    authMessage.textContent = "Informe a chave de acesso.";
    return;
  }

  authMessage.textContent = "Carregando denúncias...";
  loadButton.disabled = true;
  refreshButton.disabled = true;

  try {
    const response = await fetch("/api/reports?limit=200", {
      headers: { "x-admin-key": adminKey },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || `Falha ao carregar denúncias (HTTP ${response.status}).`);
    }

    authMessage.textContent = "Painel carregado com sucesso.";
    summary.textContent = `Total exibido: ${data.total}`;
    renderReports(data.reports);
    refreshButton.disabled = false;
    setAuthenticated(true);
  } catch (error) {
    authMessage.textContent = error.message;
    summary.textContent = "";
    reportsList.innerHTML = "";
    setAuthenticated(false);
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", () => {
  adminKey = adminKeyInput.value.trim();
  window.localStorage.setItem("admin_panel_key", adminKey);
  fetchReports();
});

refreshButton.addEventListener("click", fetchReports);

if (changeKeyButton) {
  changeKeyButton.addEventListener("click", () => {
    setAuthenticated(false);
    authMessage.textContent = "";
    adminKeyInput.focus();
  });
}

if (reportsList) {
  reportsList.addEventListener("click", (event) => {
    const card = event.target.closest(".report-card[data-index]");
    if (!card) return;
    openDetail(Number(card.dataset.index));
  });

  reportsList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".report-card[data-index]");
    if (!card) return;
    event.preventDefault();
    openDetail(Number(card.dataset.index));
  });
}

if (closeDetailButton) {
  closeDetailButton.addEventListener("click", closeDetail);
}

if (detailOverlay) {
  detailOverlay.addEventListener("click", (event) => {
    if (event.target === detailOverlay) closeDetail();
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDetail();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/admin-sw.js");
    } catch (error) {
      console.error("Falha ao registrar service worker:", error);
    }
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installButton) installButton.hidden = false;
});

if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
}
