export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { verse } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key ausente na Vercel." });
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
                        content: `Professor de Teologia. Analise o versículo e gere um devocional de 2 parágrafos e um quiz.
                        REGRAS: 
                        1. Não use negrito (**) no texto.
                        2. Responda APENAS no formato abaixo, sem saudações.
                        
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
                temperature: 0.5 // Menor temperatura = resposta mais estável no formato
            })
        });

        const data = await response.json();
        
        // Log para debug no console da Vercel
        console.log("Resposta da Groq:", JSON.stringify(data));
        
        return res.status(200).json(data);
    } catch (error) {
        console.error("Erro na API:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
