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
    const stripped = content.replace(`<@${clientUserId}>`, '')

    // loading?
    channel.sendTyping()

    try {
      // if in a reply thread
      const prompt = await applyReferences(msg, stripped)

      console.log(prompt)

      const choices = await ask(prompt)

      console.log(choices)

      let response = choices.map((choice) => choice.text).join('\n\n')

      if (choices[0].finish_reason === 'length') {
        response = `${response}....  Sorry, I ran out of tokens, possibly because <@${process.env.ME}> is too cheap`
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

// don't confuse the AI with the name we give it on Discord
const getAuthorUserName = (msg: Message<boolean>): string => {
  if (msg.author.id == client.user?.id) {
    // i.e. OpenAI
    return 'You'
  }

  return msg.author.username
}

const applyReferences = async (
  msg: Message<boolean>,
  content: string
): Promise<string> => {
  if (msg.reference != null) {
    const prev = await msg.fetchReference()

    // prepend latest message's username
    const author = getAuthorUserName(msg)
    if (!content.startsWith(author)) {
      content = `${author}: ${content}`
    }

    // prepend prev message
    content = `${getAuthorUserName(prev)}: ${prev.content}

${content}`

    return applyReferences(prev, content)
  }

  return content
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`)
})

client.login(process.env.TOKEN)
