import { runWithFallback } from "@/lib/provider-fallback";

export async function translateWithFallback(input: {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}) {
  return runWithFallback<{ text: string }>([
    {
      name: "DeepL",
      run: async () => {
        const token = process.env.DEEPL_API_KEY;
        if (!token) throw new Error("未配置 DEEPL_API_KEY");
        const body = new URLSearchParams({
          text: input.text,
          target_lang: input.targetLanguage.toUpperCase()
        });

        if (input.sourceLanguage) {
          body.set("source_lang", input.sourceLanguage.toUpperCase());
        }

        const response = await fetch(process.env.DEEPL_API_URL ?? "https://api-free.deepl.com/v2/translate", {
          method: "POST",
          headers: {
            Authorization: `DeepL-Auth-Key ${token}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body
        });

        if (!response.ok) {
          throw new Error(`DeepL HTTP ${response.status}`);
        }

        const data = (await response.json()) as { translations?: Array<{ text?: string }> };
        const text = data.translations?.[0]?.text;
        if (!text) throw new Error("DeepL 未返回译文");
        return { text };
      }
    },
    {
      name: "deepseek-v4-flash",
      run: async () => {
        const token = process.env.DEEPSEEK_API_KEY;
        if (!token) throw new Error("未配置 DEEPSEEK_API_KEY");
        const response = await fetch(process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_TRANSLATE_MODEL ?? "deepseek-v4-flash",
            messages: [
              {
                role: "user",
                content: `请翻译成 ${input.targetLanguage}，只返回译文：\n\n${input.text}`
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`DeepSeek Translate HTTP ${response.status}`);
        }

        const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error("DeepSeek 翻译未返回文本");
        return { text };
      }
    }
  ]);
}
