import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export const ask = async (prompt: string) => {
  const completion = await openai.createCompletion({
    prompt,
    model: 'text-davinci-003',
    temperature: 0.6,
    max_tokens: 365,
  })

  return completion.data.choices
}
