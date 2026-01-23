orexport default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { verse } = req.body;
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
                model: "llama-3-8b-8192",
messages: [
    { 
        role: "system", 
        content: `Você é um professor de teologia acadêmico. 
        Analise o versículo de forma clara e gere um devocional de nominimo 2 paragrafos e crie um quiz.
        IMPORTANTE: Responda DIRETAMENTE no formato abaixo, sem introduções. As respostas não podem estar na mesma opção que estava antes
        
        EXPLICAÇÃO: [texto]
        PERGUNTA: [texto]
        A) [opção]
        B) [opção]
        C) [opção]
        D) [opção]
        CORRETA: [Letra]` 
    },
    { role: "user", content: `Analise o versículo: "${verse}".` }
],
                temperature: 0.6 // Aumentado levemente para maior criatividade nos distratores
            })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Erro interno ao processar estudo." });
    }
}




