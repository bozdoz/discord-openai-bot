import { Client, GatewayIntentBits, Message } from 'discord.js'
import { ask } from './api/openapi'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.MessageContent,
  ],
})

client.on('messageCreate', async (msg) => {
  const { author, mentions, content, channel } = msg

  // don't listen to any bot
  if (author.bot) {
    return
  }

  const clientUserId = client.user?.id || ''

  // if mentioned directly, send a DM
  if (mentions.users.has(clientUserId)) {
    // strip username
    const stripped = cleanUserMention(content)

    // loading?
    channel.sendTyping()

    try {
      // if in a reply thread
      const prompt = await getContext(msg, stripped)

      console.log(prompt)

      const choices = await ask(prompt)

      console.log(choices)

      let response = choices.map((choice) => choice.text).join('\n\n')

      // dumbass bot
      response = response.replace(botPrefix, '')

      if (choices[0].finish_reason === 'length') {
        response = `${response}....  Sorry, I ran out of tokens, possibly because ${getUserMention(
          process.env.ME || ''
        )} is too cheap`
      }

      await msg.reply(response)
    } catch (e) {
      console.error(e)

      const sent = await msg.reply("I have no idea what I'm doing")

      sent.react('😭')
    }

    return
  }
})

const botPrefix = 'You said: '

const getContext = async (msg: Message<boolean>, content: string) => {
  const references = await applyReferences(msg, content)

  if (msg.reference == null) {
    return references
  }

  return `You are in a chat room.  

Your previous responses are prefixed by "${botPrefix}".

Below is a transcript of what was said; what is your response?

${references}`
}

const cleanUserMention = (content: string) =>
  content.replace(getUserMention(client.user?.id || ''), '')

const getUserMention = (id: string): string => `<@${id}>`

// don't confuse the AI with the name we give it on Discord
const getAuthorPrefix = (msg: Message<boolean>): string => {
  if (msg.author.id == client.user?.id) {
    // i.e. OpenAI
    return botPrefix
  }

  return `${getUserMention(msg.author.id)} said: `
}

const applyReferences = async (
  msg: Message<boolean>,
  content: string
): Promise<string> => {
  // prepend latest message's username
  const author = getAuthorPrefix(msg)
  content = `${author} ${content}`

  if (msg.reference != null) {
    const prev = await msg.fetchReference()

    // prepend prev message
    content = `${cleanUserMention(prev.content)}

${content}`

    return applyReferences(prev, content)
  }

  return content
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`)
})

client.login(process.env.TOKEN)
