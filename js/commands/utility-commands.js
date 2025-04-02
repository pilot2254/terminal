/**
 * Utility commands
 */

// Fix the import statements to use window.* for the new command modules
// Import other command modules for help command
import { fileSystemCommands } from "./file-system.js"
import { userCommands } from "./user-commands.js"
import { systemCommands } from "./system-commands.js"
import { editorCommands } from "./editor-commands.js"
import { networkCommands } from "./network-commands.js"
import { accessibilityCommands } from "./accessibility-commands.js"

export const utilityCommands = {
  help: {
    description: "Display help for available commands",
    usage: "help [command]",
    action: (args, state) => {
      // Import all command sets
      let COMMANDS = {
        ...fileSystemCommands,
        ...userCommands,
        ...systemCommands,
        ...utilityCommands,
        ...editorCommands,
        ...networkCommands,
        ...accessibilityCommands,
      }

      // Add new command modules if they exist
      if (window.windowCommands) COMMANDS = { ...COMMANDS, ...window.windowCommands }
      if (window.jobCommands) COMMANDS = { ...COMMANDS, ...window.jobCommands }
      if (window.calculatorCommands) COMMANDS = { ...COMMANDS, ...window.calculatorCommands }
      if (window.cronCommands) COMMANDS = { ...COMMANDS, ...window.cronCommands }
      if (window.lintCommands) COMMANDS = { ...COMMANDS, ...window.lintCommands }
      if (window.themeCommands) COMMANDS = { ...COMMANDS, ...window.themeCommands }
      if (window.tmuxCommands) COMMANDS = { ...COMMANDS, ...window.tmuxCommands }

      if (args.length === 0) {
        // List all commands
        let output = "Available commands:\n\n"

        // Group commands by category
        const categories = {
          "File System": ["ls", "cd", "pwd", "mkdir", "touch", "cat", "rm", "cp", "mv", "echo"],
          "User Management": ["whoami", "useradd", "userdel", "passwd", "su", "users"],
          System: ["clear", "banner", "date", "uname", "hostname", "reboot"],
          Utility: ["help", "man", "history", "alias", "grep", "calc", "bc"],
          Editor: ["vim", "nano"],
          Network: ["ping", "wget", "curl", "host"],
          Accessibility: ["contrast", "a11y"],
          "Window System": ["window"],
          "Job Control": ["jobs", "bg", "fg", "kill", "sleep"],
          Scheduling: ["cron", "crontab"],
          Development: ["lint"],
          Customization: ["theme"],
          "Terminal Multiplexer": ["tmux"],
        }

        for (const category in categories) {
          output += `${category}:\n`
          for (const cmd of categories[category]) {
            if (COMMANDS[cmd]) {
              output += `  ${cmd.padEnd(10)} - ${COMMANDS[cmd].description}\n`
            }
          }
          output += "\n"
        }

        output += 'Type "help <command>" for more information about a specific command.'
        return output
      } else {
        // Show help for specific command
        const cmd = args[0].toLowerCase()

        if (COMMANDS[cmd]) {
          return `${cmd} - ${COMMANDS[cmd].description}\n\nUsage: ${COMMANDS[cmd].usage}`
        } else {
          return `help: no help topics match '${cmd}'`
        }
      }
    },
  },

  man: {
    description: "Display manual page for a command",
    usage: "man <command>",
    action: (args, state) => {
      if (args.length === 0) {
        return "What manual page do you want?"
      }

      const cmd = args[0].toLowerCase()

      // Import all command sets
      const COMMANDS = {
        ...fileSystemCommands,
        ...userCommands,
        ...systemCommands,
        ...utilityCommands,
        ...editorCommands,
        ...networkCommands,
        ...accessibilityCommands,
      }

      if (COMMANDS[cmd]) {
        return `
NAME
       ${cmd} - ${COMMANDS[cmd].description}

SYNOPSIS
       ${COMMANDS[cmd].usage}

DESCRIPTION
       ${COMMANDS[cmd].description}
`
      } else {
        return `No manual entry for ${cmd}`
      }
    },
  },

  history: {
    description: "Display command history",
    usage: "history [n]",
    action: (args, state) => {
      const limit = args.length > 0 ? Number.parseInt(args[0]) : state.commandHistory.length

      if (isNaN(limit) || limit <= 0) {
        return "history: invalid argument"
      }

      const historyToShow = state.commandHistory.slice(0, limit)
      let output = ""

      for (let i = 0; i < historyToShow.length; i++) {
        output += `${i + 1}  ${historyToShow[i]}\n`
      }

      return output.trim()
    },
  },

  alias: {
    description: "Define or display aliases",
    usage: "alias [name[=value]]",
    action: (args, state) => {
      // In a real terminal, this would define aliases
      // For this simulation, we'll just pretend it works
      if (args.length === 0) {
        return "No aliases defined"
      } else if (args[0].includes("=")) {
        const [name, value] = args[0].split("=")
        return `Alias ${name} created (simulated)`
      } else {
        return `alias: ${args[0]}: not found`
      }
    },
  },

  grep: {
    description: "Search for patterns in files",
    usage: "grep <pattern> <file>",
    action: (args, state) => {
      if (args.length < 2) {
        return "grep: missing operand\nUsage: grep <pattern> <file>"
      }

      const pattern = args[0]
      const filePath = args[1]
      const normalizedPath = window.terminalHelpers.normalizePath(filePath, state.currentPath)
      const file = window.terminalHelpers.getPathObject(normalizedPath, state.fileSystem)

      if (!file) {
        return `grep: ${filePath}: No such file or directory`
      }

      if (file.type !== "file") {
        return `grep: ${filePath}: Is a directory`
      }

      try {
        const regex = new RegExp(pattern, "g")
        const lines = file.content.split("\n")
        const matches = lines.filter((line) => regex.test(line))

        if (matches.length === 0) {
          return ""
        }

        return matches.join("\n")
      } catch (error) {
        return `grep: invalid regular expression: ${error.message}`
      }
    },
  },
}

