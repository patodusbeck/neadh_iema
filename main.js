const menuToggle = document.querySelector(".menu-toggle");
const menu = document.getElementById("menu-principal");

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealElements = document.querySelectorAll(".reveal");
if (revealElements.length > 0) {
  document.documentElement.classList.add("animations-on");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealElements.forEach((item) => observer.observe(item));
}

const form = document.getElementById("reportForm");
const formMessage = document.getElementById("formMessage");
const protocolBox = document.getElementById("protocolBox");
const protocolNumber = document.getElementById("protocolNumber");
const submitButton = document.getElementById("submitReport");

const stepPanels = [...document.querySelectorAll(".form-step")];
const stepMarkers = [...document.querySelectorAll(".form-steps li")];
let currentStep = 0;

const showStep = (index) => {
  currentStep = index;
  stepPanels.forEach((panel, panelIndex) => {
    panel.classList.toggle("is-active", panelIndex === index);
  });
  stepMarkers.forEach((marker, markerIndex) => {
    marker.classList.toggle("is-active", markerIndex === index);
  });
  formMessage.textContent = "";
};

const validateStep = (index) => {
  const panel = stepPanels[index];
  if (!panel) return true;
  const requiredFields = [...panel.querySelectorAll("[required]")];

  for (const field of requiredFields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  return true;
};

if (form) {
  form.addEventListener("click", (event) => {
    const nextButton = event.target.closest(".step-next");
    const prevButton = event.target.closest(".step-prev");

    if (nextButton) {
      if (validateStep(currentStep) && currentStep < stepPanels.length - 1) {
        showStep(currentStep + 1);
      }
    }

    if (prevButton && currentStep > 0) {
      showStep(currentStep - 1);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateStep(currentStep)) return;
    formMessage.textContent = "Enviando denúncia...";
    if (protocolBox) protocolBox.hidden = true;
    if (submitButton) submitButton.disabled = true;

    const payload = {
      tipo: form.tipo.value.trim(),
      local: form.local.value.trim(),
      data: form.data.value,
      hora: form.hora.value,
      envolvidos: form.envolvidos.value.trim(),
      descricao: form.descricao.value.trim(),
      nome: form.nome.value.trim(),
      contato: form.contato.value.trim(),
      consentimento: Boolean(form.consentimento.checked),
    };

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível enviar a denúncia.");
      }

      formMessage.textContent = "Denúncia registrada com sucesso.";
      if (protocolBox && protocolNumber) {
        protocolNumber.textContent = data.protocol;
        protocolBox.hidden = false;
      }
      form.reset();
      showStep(0);
    } catch (error) {
      formMessage.textContent = error.message;
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
