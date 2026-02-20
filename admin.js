const adminKeyInput = document.getElementById("adminKey");
const loadButton = document.getElementById("loadReports");
const refreshButton = document.getElementById("refreshReports");
const installButton = document.getElementById("installApp");
const authMessage = document.getElementById("authMessage");
const summary = document.getElementById("summary");
const reportsList = document.getElementById("reportsList");

let adminKey = "";
let deferredInstallPrompt = null;

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

function renderReports(reports) {
  if (!Array.isArray(reports) || reports.length === 0) {
    reportsList.innerHTML = '<article class="empty">Nenhuma denúncia encontrada.</article>';
    return;
  }

  reportsList.innerHTML = reports
    .map((report) => {
      const name = report.nome ? escapeHtml(report.nome) : "Anônimo";
      const contato = report.contato ? escapeHtml(report.contato) : "Não informado";
      return `
        <article class="report-card">
          <h2>${escapeHtml(report.protocol)} - ${escapeHtml(report.tipo)}</h2>
          <p class="meta">
            <strong>Data:</strong> ${formatDate(report.createdAt)} |
            <strong>Status:</strong> ${escapeHtml(report.status || "novo")} |
            <strong>Nome:</strong> ${name} |
            <strong>Contato:</strong> ${contato}
          </p>
          <p class="desc">${escapeHtml(report.descricao)}</p>
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
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Falha ao carregar denúncias.");
    }

    authMessage.textContent = "Painel carregado com sucesso.";
    summary.textContent = `Total exibido: ${data.total}`;
    renderReports(data.reports);
    refreshButton.disabled = false;
  } catch (error) {
    authMessage.textContent = error.message;
    summary.textContent = "";
    reportsList.innerHTML = "";
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", () => {
  adminKey = adminKeyInput.value.trim();
  fetchReports();
});

refreshButton.addEventListener("click", fetchReports);

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
