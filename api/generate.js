export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { verse } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    // Validação inicial para evitar chamadas desnecessárias
    if (!apiKey) {
        return res.status(500).json({ error: "Configuração incompleta: GROQ_API_KEY não encontrada na Vercel." });
    }

    if (!verse) {
        return res.status(400).json({ error: "O versículo não foi enviado corretamente." });
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
                        content: `Você é um professor de teologia. Analise o versículo e crie um devocional (2 parágrafos) e um quiz.
                        REGRAS: 
                        - Responda APENAS no formato abaixo.
                        - Proibido qualquer texto antes ou depois do formato.
                        
                        EXPLICAÇÃO: [texto]
                        PERGUNTA: [texto]
                        A) [opção]
                        B) [opção]
                        C) [opção]
                        D) [opção]
                        CORRETA: [Letra]` 
                    },
                    { role: "user", content: `Analise: "${verse}".` }
                ],
                temperature: 0.4
            })
        });

        const data = await response.json();

        // TRATAMENTO DE ERRO: Se a Groq responder com erro (401, 429, 400, etc.)
        if (!response.ok) {
            console.error("Erro retornado pela Groq:", data);
            return res.status(response.status).json({ 
                error: data.error?.message || "A Groq recusou a requisição." 
            });
        }

        // Sucesso total
        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro na conexão com o servidor:", error);
        return res.status(500).json({ error: "Falha crítica na conexão com o servidor de IA." });
    }
}

