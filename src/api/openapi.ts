import axios from 'axios'

interface Response {
  finish_reason: string
  text: string
}

interface AxiosResponse {
  id: string
  object: string
  created: number
  model: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  choices: [
    {
      message: {
        role: string
        content: string
      }
      finish_reason: string
      index: number
    }
  ]
}

export const ask = async (prompt: string): Promise<Response> => {
  try {
    const completion = await axios.post<AxiosResponse>(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 512,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    )

    return {
      finish_reason: completion.data.choices[0].finish_reason,
      text: completion.data.choices[0].message.content
    }
  } catch (e: any) {
    console.error('failed openAI request:', e.message, e.response.data)
  }

  return {
    finish_reason: 'error',
    text: 'request failed'
  }
}
