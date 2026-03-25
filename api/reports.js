const clientPromise = require("../lib/mongodb");

const PROTOCOL_PREFIX = "NEADH";
const DB_NAME = process.env.MONGODB_DB || "neadh_iema";
const COLLECTION = process.env.MONGODB_COLLECTION || "denuncias";
const ADMIN_PANEL_KEY = process.env.ADMIN_PANEL_KEY || "";

function generateProtocol() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${PROTOCOL_PREFIX}-${y}${m}${d}-${random}`;
}

function cleanText(value, maxLen = 2000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function getAdminKey(req) {
  return req.headers["x-admin-key"] || req.query?.key || "";
}

module.exports = async function handler(req, res) {
  if (!clientPromise) {
    return res.status(500).json({ error: "Configuracao do banco de dados nao encontrada." });
  }

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    if (req.method === "POST") {
      const tipo = cleanText(req.body?.tipo, 100);
      const local = cleanText(req.body?.local, 160);
      const dataOcorrencia = cleanText(req.body?.data, 20);
      const horaOcorrencia = cleanText(req.body?.hora, 20);
      const envolvidos = cleanText(req.body?.envolvidos, 200);
      const descricao = cleanText(req.body?.descricao, 4000);
      const nome = cleanText(req.body?.nome, 140);
      const contato = cleanText(req.body?.contato, 180);
      const consentimento = Boolean(req.body?.consentimento);

      if (!tipo || !local || !dataOcorrencia || !horaOcorrencia || !envolvidos || !descricao) {
        return res
          .status(400)
          .json({ error: "Tipo, local, data, hora, envolvidos e descricao sao obrigatorios." });
      }

      if (!consentimento) {
        return res.status(400).json({ error: "E necessario confirmar o consentimento para enviar." });
      }

      const protocol = generateProtocol();
      await collection.insertOne({
        protocol,
        tipo,
        local,
        dataOcorrencia,
        horaOcorrencia,
        envolvidos,
        descricao,
        nome: nome || null,
        contato: contato || null,
        consentimento,
        status: "novo",
        source: "site",
        createdAt: new Date(),
        meta: {
          ip:
            req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
            req.socket?.remoteAddress ||
            null,
          userAgent: req.headers["user-agent"] || null,
        },
      });

      return res.status(201).json({
        ok: true,
        protocol,
        message: "Denuncia registrada com sucesso.",
      });
    }

    if (req.method === "GET") {
      if (!ADMIN_PANEL_KEY) {
        return res.status(500).json({ error: "ADMIN_PANEL_KEY nao configurada no servidor." });
      }

      if (getAdminKey(req) !== ADMIN_PANEL_KEY) {
        return res.status(401).json({ error: "Chave administrativa invalida." });
      }

      const limitParam = Number(req.query?.limit || 100);
      const limit = Math.min(Math.max(limitParam || 100, 1), 300);
      const reports = await collection
        .find({}, { projection: { meta: 0 } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return res.status(200).json({ ok: true, total: reports.length, reports });
    }

    res.setHeader("Allow", "POST, GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  } catch (error) {
    console.error("Erro na API de denuncias:", error);
    return res.status(500).json({ error: "Erro interno na API de denuncias." });
  }
};
