export default async function handler(req, res) {
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
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `Você é um professor de teologia acadêmico. 
                        Sua tarefa é analisar versículos e criar um quiz desafiador. 
                        REGRAS RÍGIDAS:
                        1. EXPLICAÇÃO: Texto profundo com 3 parágrafos.
                        2. PERGUNTA: Deve testar a interpretação do texto.
                        3. OPÇÕES (A, B, C, D): 
                           - Devem ser COMPLETAMENTE DIFERENTES entre si.
                           - Proibido repetir conceitos ou palavras-chave entre as opções.
                           - As opções incorretas (distratores) devem ser plausíveis e baseadas no contexto bíblico, mas erradas conforme a sua explicação.
                        4. FORMATO: Responda apenas seguindo este padrão:
                        EXPLICAÇÃO: [texto]
                        PERGUNTA: [texto]
                        A) [opção]
                        B) [opção]
                        C) [opção]
                        D) [opção]
                        CORRETA: [Letra]` 
                    },
                    { role: "user", content: `Analise o versículo: "${verse}".` } "Responda diretamente no formato solicitado, sem introduções ou cumprimentos."
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

