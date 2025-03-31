/**
 * Utility commands
 */

export const utilityCommands = {
  help: {
    description: "Display help for available commands",
    usage: "help [command]",
    action: (args, state) => {
      // Import all command sets
      const COMMANDS = {
        ...fileSystemCommands,
        ...userCommands,
        ...systemCommands,
        ...utilityCommands,
        ...editorCommands,
        ...networkCommands,
        ...markdownCommands,
        ...accessibilityCommands,
      }

      if (args.length === 0) {
        // List all commands
        let output = "Available commands:\n\n"

        // Group commands by category
        const categories = {
          "File System": ["ls", "cd", "pwd", "mkdir", "touch", "cat", "rm", "cp", "mv", "echo"],
          "User Management": ["whoami", "useradd", "userdel", "passwd", "su", "users"],
          System: ["clear", "banner", "date", "uname", "hostname", "reboot"],
          Utility: ["help", "man", "history", "alias", "grep"],
          Editor: ["vim", "nano"],
          Network: ["ping", "wget", "curl", "host"],
          Markdown: ["markdown", "md"],
          Accessibility: ["contrast", "a11y"],
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
        ...markdownCommands,
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
      const normalizedPath = normalizePath(filePath, state.currentPath)
      const file = getPathObject(normalizedPath, state.fileSystem)

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

// Helper functions
function normalizePath(path, currentPath) {
  // Handle absolute paths
  if (path.startsWith("/")) {
    // Path is already absolute
  } else if (path.startsWith("~/")) {
    // Replace ~ with /home/username
    path = `/home/${window.state?.currentUser || "currentuser"}${path.substring(1)}`
  } else {
    // Relative path - combine with current path
    path = `${currentPath}/${path}`
  }

  // Split path into components
  const components = path.split("/").filter((c) => c !== "")
  const result = []

  // Process each component
  for (const component of components) {
    if (component === ".") {
      // Current directory - do nothing
    } else if (component === "..") {
      // Parent directory - pop the last component
      if (result.length > 0) {
        result.pop()
      }
    } else {
      // Regular component - add to result
      result.push(component)
    }
  }

  // Combine components back into a path
  return `/${result.join("/")}`
}

function getPathObject(path, fileSystem) {
  if (path === "/") {
    return fileSystem["/"]
  }

  const components = path.split("/").filter((c) => c !== "")
  let current = fileSystem["/"]

  for (const component of components) {
    if (!current || current.type !== "directory" || !current.contents[component]) {
      return null
    }
    current = current.contents[component]
  }

  return current
}

// Import other command modules for help command
import { fileSystemCommands } from "./file-system.js"
import { userCommands } from "./user-commands.js"
import { systemCommands } from "./system-commands.js"
import { editorCommands } from "./editor-commands.js"
import { networkCommands } from "./network-commands.js"
import { markdownCommands } from "./markdown-commands.js"
import { accessibilityCommands } from "./accessibility-commands.js"