/**
 * Copyright (C) 2024  Jochem-W
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import {
  InteractionContextType,
  PermissionFlagsBits,
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  ChannelType,
} from "discord.js"
import d from "./index.mjs"

d.slashCommand("", "")
  .options({
    text: d.string("Example option").required().choices({ a: "a", b: "b" }),
    count: d.number("Example option"),
    chan: d
      .channel("Example channel")
      .required()
      .channelTypes(ChannelType.GuildCategory, ChannelType.GuildText),
  })
  .handler(async (interaction, { text, chan }) => {
    await interaction.reply(text)
  })
  .contexts(InteractionContextType.BotDM, InteractionContextType.Guild)
  .defaultMemberPermissions(PermissionFlagsBits.AddReactions)
  .integrationTypes(ApplicationIntegrationType.GuildInstall)
  .nsfw()

d.slashCommand("", "")
  .handler(async (interaction) => {
    await interaction.deferReply()
  })
  .contexts(InteractionContextType.BotDM, InteractionContextType.Guild)
  .defaultMemberPermissions(PermissionFlagsBits.AddReactions)
  .integrationTypes(ApplicationIntegrationType.GuildInstall)
  .nsfw()
  .handle(null as unknown as ChatInputCommandInteraction)
  .catch((e: unknown) => {
    console.error(e)
  })

d.slashCommand("", "")
  .subcommands({
    test: d.subcommand("test").handler(async (interaction) => {
      await interaction.deferReply()
    }),
  })
  .subcommandGroups({
    group: d.subcommandGroup("desc").subcommands({
      command: d.subcommand("").handler(async (interaction) => {
        await interaction.deferReply()
      }),
    }),
  })
  .contexts(InteractionContextType.BotDM, InteractionContextType.Guild)
  .defaultMemberPermissions(PermissionFlagsBits.AddReactions)
  .integrationTypes(ApplicationIntegrationType.GuildInstall)
  .nsfw()
  .handle(null as unknown as ChatInputCommandInteraction)
  .catch((e: unknown) => {
    console.error(e)
  })
