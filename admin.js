const adminKeyInput = document.getElementById("adminKey");
const loadButton = document.getElementById("loadReports");
const refreshButton = document.getElementById("refreshReports");
const installButton = document.getElementById("installApp");
const enableNotificationsButton = document.getElementById("enableNotifications");
const changeKeyButton = document.getElementById("changeKey");
const authBox = document.getElementById("authBox");
const authMessage = document.getElementById("authMessage");
const summary = document.getElementById("summary");
const reportsList = document.getElementById("reportsList");

const detailOverlay = document.getElementById("detailOverlay");
const closeDetailButton = document.getElementById("closeDetail");
const detailTitle = document.getElementById("detailTitle");
const detailStatus = document.getElementById("detailStatus");
const detailType = document.getElementById("detailType");
const detailLocal = document.getElementById("detailLocal");
const detailWhen = document.getElementById("detailWhen");
const detailInvolved = document.getElementById("detailInvolved");
const detailName = document.getElementById("detailName");
const detailContact = document.getElementById("detailContact");
const detailDesc = document.getElementById("detailDesc");
const detailProtocol = document.getElementById("detailProtocol");
const downloadPdfButton = document.getElementById("downloadPdf");
const newReportsAlert = document.getElementById("newReportsAlert");
const newReportsMessage = document.getElementById("newReportsMessage");
const dismissNewReportsButton = document.getElementById("dismissNewReports");

let adminKey = "";
let deferredInstallPrompt = null;
let reportsCache = [];
let activeReport = null;
let knownReportKeys = new Set();
let hasLoadedReports = false;
let pollingTimer = null;

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

function getReportKey(report) {
  return report.protocol || `${report.createdAt}-${report.tipo}-${report.local}`;
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalonePwa() {
  return window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
}

function updateNotificationButton() {
  if (!enableNotificationsButton) return;
  if (!("Notification" in window)) {
    enableNotificationsButton.hidden = false;
    enableNotificationsButton.disabled = false;
    enableNotificationsButton.textContent = isIosDevice() && !isStandalonePwa()
      ? "Como ativar no iPhone"
      : "Notificações indisponíveis";
    enableNotificationsButton.title = "No iPhone, instale o painel na Tela de Início para ativar notificações.";
    return;
  }
  enableNotificationsButton.hidden = false;
  enableNotificationsButton.textContent = Notification.permission === "granted"
    ? "Notificações ativadas"
    : "Ativar notificações";
  enableNotificationsButton.disabled = Notification.permission === "granted";
}

function showNewReportsNotification(newReports) {
  if (!newReports.length) return;
  const count = newReports.length;
  const message = count === 1
    ? "Chegou uma nova denúncia."
    : `Chegaram ${count} novas denúncias.`;

  if (newReportsAlert && newReportsMessage) {
    newReportsMessage.textContent = message;
    newReportsAlert.hidden = false;
  }

  document.title = `(${count}) Painel NEADH | Denúncias`;
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Nova denúncia no painel NEADH", {
      body: message,
      icon: "assets/icons/pwa-192.png",
      tag: "neadh-new-report",
    });
  }
}

function setAuthenticated(isAuthenticated) {
  if (!authBox || !changeKeyButton) return;
  authBox.classList.toggle("is-hidden", isAuthenticated);
  changeKeyButton.hidden = !isAuthenticated;
}

function openDetail(index) {
  const report = reportsCache[index];
  if (!report || !detailOverlay) return;
  activeReport = report;

  const date = formatDate(report.createdAt);
  const status = getStatusLabel(report.status);
  const nome = report.nome || "Anônimo";
  const contato = report.contato || "Não informado";
  const local = report.local || "Não informado";
  const envolvidos = report.envolvidos || "Não informado";
  const quando = report.dataOcorrencia
    ? `${report.dataOcorrencia}${report.horaOcorrencia ? ` às ${report.horaOcorrencia}` : ""}`
    : "Não informado";

  detailTitle.textContent = date;
  detailStatus.textContent = `Status: ${status}`;
  detailType.textContent = `Tipo: ${report.tipo || "Não informado"}`;
  detailLocal.textContent = `Local: ${local}`;
  detailWhen.textContent = `Quando: ${quando}`;
  detailInvolved.textContent = `Envolvidos: ${envolvidos}`;
  detailName.textContent = `Nome: ${nome}`;
  detailContact.textContent = `Contato: ${contato}`;
  detailDesc.textContent = report.descricao || "Sem descrição.";
  detailProtocol.textContent = `Protocolo: ${report.protocol || "indisponível"}`;

  detailOverlay.classList.remove("is-hidden");
  detailOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

async function loadImageDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar a logo institucional.");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não foi possível preparar a logo institucional."));
    reader.readAsDataURL(blob);
  });
}

async function downloadActiveReportPdf() {
  if (!activeReport) return;
  if (!window.jspdf?.jsPDF) {
    authMessage.textContent = "Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente.";
    return;
  }

  const report = activeReport;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const contentWidth = 210 - margin * 2;
  let y = 22;

  try {
    const logoDataUrl = await loadImageDataUrl("assets/images/ipcarolina.png");
    doc.addImage(logoDataUrl, "PNG", margin, 10, 27, 27, undefined, "FAST");
  } catch (error) {
    console.warn("Logo institucional não adicionada ao PDF:", error);
  }

  doc.setTextColor(94, 35, 38);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("IEMA PLENO CAROLINA", margin + 34, 16);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text("Núcleo de Educação Antirracista e em Direitos Humanos (NEADH)", margin + 34, 22);
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("Relatório de denúncia", margin, y + 25);
  y += 35;
  doc.setDrawColor(154, 59, 66);
  doc.line(margin, y, 210 - margin, y);
  y += 10;

  const fields = [
    ["Protocolo", report.protocol || "Indisponível"],
    ["Registrada em", formatDate(report.createdAt)],
    ["Status", getStatusLabel(report.status)],
    ["Tipo", report.tipo || "Não informado"],
    ["Local", report.local || "Não informado"],
    ["Data e hora da ocorrência", report.dataOcorrencia ? `${report.dataOcorrencia}${report.horaOcorrencia ? ` às ${report.horaOcorrencia}` : ""}` : "Não informado"],
    ["Envolvidos", report.envolvidos || "Não informado"],
    ["Nome", report.nome || "Anônimo"],
    ["Contato", report.contato || "Não informado"],
  ];

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  const labelWidth = Math.max(...fields.map(([label]) => doc.getTextWidth(`${label}:`))) + 5;
  const valueWidth = contentWidth - labelWidth;
  fields.forEach(([label, value]) => {
    doc.setFont(undefined, "bold");
    doc.setTextColor(59, 30, 32);
    doc.text(`${label}:`, margin, y);
    doc.setFont(undefined, "normal");
    doc.setTextColor(58, 36, 34);
    const lines = doc.splitTextToSize(String(value), valueWidth);
    doc.text(lines, margin + labelWidth, y);
    y += Math.max(6, lines.length * 5);
  });

  y += 4;
  doc.setFont(undefined, "bold");
  doc.setTextColor(59, 30, 32);
  doc.text("Descrição dos fatos", margin, y);
  y += 7;
  doc.setFont(undefined, "normal");
  const descriptionLines = doc.splitTextToSize(report.descricao || "Sem descrição.", contentWidth);
  doc.text(descriptionLines, margin, y);
  y += descriptionLines.length * 5 + 14;
  doc.setFontSize(8);
  doc.setTextColor(107, 74, 72);
  doc.text(
    `Documento gerado pelo Painel de Denúncias NEADH ${formatDate(new Date())}`,
    margin,
    Math.min(y, 285)
  );

  const safeProtocol = String(report.protocol || "sem-protocolo").replace(/[^a-z0-9-]/gi, "-");
  doc.save(`relatorio-denuncia-${safeProtocol}.pdf`);
}

function closeDetail() {
  if (!detailOverlay) return;
  detailOverlay.classList.add("is-hidden");
  detailOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
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
      const local = report.local ? escapeHtml(report.local) : "Não informado";
      const envolvidos = report.envolvidos ? escapeHtml(report.envolvidos) : "Não informado";
      const quando = report.dataOcorrencia
        ? `${escapeHtml(report.dataOcorrencia)}${report.horaOcorrencia ? ` às ${escapeHtml(report.horaOcorrencia)}` : ""}`
        : "Não informado";
      const protocolo = escapeHtml(report.protocol || "indisponível");

      return `
        <article class="report-card" data-index="${index}" tabindex="0" role="button" aria-label="Abrir detalhes da denúncia">
          <p class="row-top">
            <span class="when">${date}</span>
            <span class="status-pill status-${statusClass}">${escapeHtml(status)}</span>
          </p>
          <p class="meta"><strong>Tipo:</strong> ${tipo} </p>
          <p class="meta"><strong>Local:</strong> ${local}</p>
          <p class="meta"><strong>Quando:</strong> ${quando}</p>
          <p class="meta"><strong>Envolvidos:</strong> ${envolvidos}</p>
          <p class="meta"><strong>Nome:</strong> ${name} | <strong>Contato:</strong> ${contato}</p>
          <p class="hint">Clique para ver os detalhes completos</p>
        </article>
      `;
    })
    .join("");
}

async function fetchReports({ silent = false } = {}) {
  if (!adminKey) {
    authMessage.textContent = "Informe a chave de acesso.";
    return;
  }

  if (!silent) authMessage.textContent = "Carregando denúncias...";
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

    const incomingReports = hasLoadedReports
      ? data.reports.filter((report) => !knownReportKeys.has(getReportKey(report)))
      : [];
    knownReportKeys = new Set(data.reports.map(getReportKey));
    hasLoadedReports = true;
    if (incomingReports.length) showNewReportsNotification(incomingReports);
    if (!silent) authMessage.textContent = "Painel carregado com sucesso.";
    summary.textContent = `Total exibido: ${data.total}`;
    renderReports(data.reports);
    refreshButton.disabled = false;
    setAuthenticated(true);
    startPolling();
  } catch (error) {
    authMessage.textContent = error.message;
    summary.textContent = "";
    reportsList.innerHTML = "";
    setAuthenticated(false);
  } finally {
    loadButton.disabled = false;
  }
}

function startPolling() {
  if (pollingTimer) return;
  pollingTimer = window.setInterval(() => fetchReports({ silent: true }), 30000);
}

loadButton.addEventListener("click", () => {
  adminKey = adminKeyInput.value.trim();
  window.localStorage.setItem("admin_panel_key", adminKey);
  fetchReports();
});

refreshButton.addEventListener("click", fetchReports);

if (enableNotificationsButton) {
  enableNotificationsButton.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      authMessage.textContent = isIosDevice() && !isStandalonePwa()
        ? "No iPhone: toque em Compartilhar, escolha 'Adicionar à Tela de Início' e abra o painel pelo novo ícone para ativar as notificações."
        : "As notificações não estão disponíveis neste navegador."
      return;
    }
    await Notification.requestPermission();
    updateNotificationButton();
  });
  updateNotificationButton();
}

if (dismissNewReportsButton) {
  dismissNewReportsButton.addEventListener("click", () => {
    newReportsAlert.hidden = true;
    document.title = "Painel NEADH | Denúncias";
  });
}

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

if (downloadPdfButton) {
  downloadPdfButton.addEventListener("click", downloadActiveReportPdf);
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
