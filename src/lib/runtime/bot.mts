/**
 * Copyright (C) 2024-2025  Jochem Waqué
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import type {
  ClientOptions,
  RESTPutAPIApplicationCommandsResult,
  Webhook,
  WebhookType,
} from "discord.js"
import { Client, codeBlock, Routes } from "discord.js"
import {
  type Bot,
  type CompletedCommand,
  type ComponentBuilder,
  type ErrorContext,
  type ErrorHandler,
  InternalError,
} from "../external.mts"

export function bot(options: ClientOptions): Bot {
  const client = new Client(options)

  const commands = new Map<string, CompletedCommand>()
  const registeredCommands = new Map<string, CompletedCommand>()

  const components = new Map<string, ComponentBuilder>()

  let errorHandler: ErrorHandler = console.log
  const errorHandlerFactory = (context?: Omit<ErrorContext, "error">) => {
    return (error: unknown) => {
      errorHandler({ ...context, error })

      for (const webhook of errorWebhooks.values()) {
        webhook
          .send(codeBlock("json", JSON.stringify(context, undefined, 4)))
          .catch((error: unknown) => {
            errorHandler({ error })
          })
      }
    }
  }

  const errorWebhooks = new Map<string, Webhook<WebhookType.Incoming>>()

  client.on("interactionCreate", (interaction) => {
    if (interaction.isCommand()) {
      const command = registeredCommands.get(interaction.commandId)
      if (!command || command.type !== interaction.commandType) {
        return
      }

      command
        .handle(interaction as never)
        .catch(errorHandlerFactory({ interaction, command }))

      return
    }

    if (interaction.isAutocomplete()) {
      const command = registeredCommands.get(interaction.commandId)
      if (!command || !("autocomplete" in command)) {
        return
      }

      command
        .autocomplete(interaction)
        .catch(errorHandlerFactory({ interaction, command }))
      return
    }

    if (interaction.isMessageComponent()) {
      const split = interaction.customId.split(":")
      if (!split[0]) {
        return
      }

      const component = components.get(split[0])
      if (!component) {
        return
      }

      if (component.type !== interaction.componentType) {
        return
      }

      component
        .handle(interaction as never, ...split.slice(1))
        .catch(errorHandlerFactory({ interaction, component }))
    }
  })

  return {
    "~client": client,
    addModule(module) {
      for (const command of module.commands.values()) {
        commands.set(command.name, command)
      }

      for (const handler of module.events) {
        const wrapped = (...params: Parameters<typeof handler.handle>) => {
          try {
            handler
              .handle(...params)
              ?.catch(
                errorHandlerFactory({ handler, handlerParameters: params }),
              )
          } catch (error) {
            errorHandlerFactory({ handler, handlerParameters: params })(error)
          }
        }

        if (handler.once === true) {
          client.once(handler.event, wrapped)
          continue
        }

        client.on(handler.event, wrapped)
      }

      for (const component of module.components) {
        if (components.has(component.id)) {
          throw new InternalError(
            "duplicate_custom_id",
            `The custom ID "${component.id}" is already in use`,
          )
        }

        components.set(component.id, component)
      }

      return this
    },
    errorHandler(handler) {
      errorHandler = handler
      return this
    },
    addErrorWebhook(webhook) {
      errorWebhooks.set(webhook.id, webhook)
      return this
    },
    register() {
      client.once("ready", (client) => {
        client.rest
          .put(Routes.applicationCommands(client.application.id), {
            body: [...commands.values()].map((command) =>
              command.builder.toJSON(),
            ),
          })
          .then((data) => {
            for (const registration of data as RESTPutAPIApplicationCommandsResult) {
              const command = commands.get(registration.name)
              if (!command) {
                throw new InternalError(
                  "could_not_register",
                  `Could not correctly register command "${registration.name} (${registration.id})"`,
                )
              }

              registeredCommands.set(registration.id, command)
              command.id = registration.id
            }
          })
          .catch(errorHandlerFactory())
      })
      return this
    },
    async login(token) {
      await client.login(token)
      return this
    },
  }
}
