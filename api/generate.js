export default async function handler(req, res) {
    // Configurações de cabeçalho para permitir a comunicação
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { verse } = req.body;
    // Puxa a chave das variáveis de ambiente da Vercel
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Chave de API não configurada no servidor Vercel." });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "Você é um professor de teologia profundo. Responda rigorosamente no formato: EXPLICAÇÃO: [texto curto de 3 parágrafos] PERGUNTA: [texto da pergunta] A) [opção] B) [opção] C) [opção] D) [opção] CORRETA: [Letra]" 
                    },
                    { role: "user", content: `Analise o versículo: "${verse}".` }
                ],
                temperature: 0.4
            })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Erro interno ao processar estudo." });
    }
}