export class OllamaService {
  private static readonly BASE_URL = 'http://localhost:11434';

  static async getCompletion(prompt: string, language: string): Promise<string> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5-coder:1.5b',
          prompt: `Complete this ${language} code:\n\n${prompt}`,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            max_tokens: 100,
            stop: ['\n\n', '```']
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response?.trim() || '';
    } catch (error) {
      console.error('Ollama completion error:', error);
      return '';
    }
  }

  static async getChatResponse(message: string, context?: string): Promise<string> {
    try {
      const prompt = context 
        ? `Context:\n${context}\n\nUser: ${message}\nAssistant:`
        : `User: ${message}\nAssistant:`;

      const response = await fetch(`${this.BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5-coder:7b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 500
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response?.trim() || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Ollama chat error:', error);
      return 'Error: Could not connect to AI service.';
    }
  }

  static async streamChatResponse(
    message: string, 
    context: string | undefined,
    onToken: (token: string) => void
  ): Promise<void> {
    try {
      const prompt = context 
        ? `Context:\n${context}\n\nUser: ${message}\nAssistant:`
        : `User: ${message}\nAssistant:`;

      const response = await fetch(`${this.BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5-coder:7b',
          prompt: prompt,
          stream: true,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 500
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              onToken(data.response);
            }
          } catch (e) {
            // Ignore malformed JSON lines
          }
        }
      }
    } catch (error) {
      console.error('Ollama streaming error:', error);
      onToken('Error: Could not connect to AI service.');
    }
  }
}