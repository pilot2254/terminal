/**
 * Terminal.js - Main terminal functionality
 */

// Import commands from separate files
import { fileSystemCommands } from "./commands/file-system.js"
import { userCommands } from "./commands/user-commands.js"
import { systemCommands } from "./commands/system-commands.js"
import { utilityCommands } from "./commands/utility-commands.js"
import { editorCommands } from "./commands/editor-commands.js"
import { networkCommands } from "./commands/network-commands.js"
import { markdownCommands } from "./commands/markdown-commands.js"
import { accessibilityCommands } from "./commands/accessibility-commands.js"

// Combine all commands into a single object
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

// File system version for migrations
const FILE_SYSTEM_VERSION = 2

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const terminal = document.getElementById("terminal")
  const output = document.getElementById("terminal-output")
  const input = document.getElementById("terminal-input")
  const promptElement = document.getElementById("terminal-prompt")

  // Terminal state
  const state = {
    currentUser: "currentuser",
    currentPath: "/home/currentuser",
    previousPath: "/",
    commandHistory: [],
    historyIndex: -1,
    currentInput: "",
    fileSystem: initializeFileSystem(),
    vimState: null,
    highContrastMode: false,
    accessibilityMode: false,
    networkState: {
      online: true,
      hosts: {
        "google.com": { ip: "142.250.190.78", latency: 20 },
        "github.com": { ip: "140.82.121.3", latency: 35 },
        localhost: { ip: "127.0.0.1", latency: 1 },
      },
    },
  }

  // Initialize file system
  function initializeFileSystem() {
    // Load from localStorage if available
    if (localStorage.getItem("terminalFileSystem")) {
      try {
        const savedData = JSON.parse(localStorage.getItem("terminalFileSystem"))

        // Check version for migrations
        if (savedData.version !== FILE_SYSTEM_VERSION) {
          console.log(`Migrating file system from version ${savedData.version} to ${FILE_SYSTEM_VERSION}`)
          return migrateFileSystem(savedData)
        }

        return savedData.data
      } catch (e) {
        console.error("Error loading file system:", e)
      }
    }

    // Default file system structure
    return {
      "/": {
        type: "directory",
        contents: {
          home: {
            type: "directory",
            contents: {
              currentuser: {
                type: "directory",
                contents: {
                  "welcome.txt": {
                    type: "file",
                    content: 'Welcome to the terminal!\nType "help" to see available commands.',
                  },
                  "example.md": {
                    type: "file",
                    content:
                      "# Markdown Example\n\nThis is an example markdown file.\n\n## Features\n\n- **Bold text**\n- *Italic text*\n- `Code snippets`\n\n### Lists\n\n1. First item\n2. Second item\n3. Third item\n\n```\ncode block\n```\n\n> Blockquote example\n\n[Link example](https://example.com)",
                  },
                },
              },
            },
          },
          bin: {
            type: "directory",
            contents: {},
          },
          etc: {
            type: "directory",
            contents: {
              passwd: {
                type: "file",
                content:
                  "root:x:0:0:root:/root:/bin/bash\ncurrentuser:x:1000:1000:Current User:/home/currentuser:/bin/bash",
              },
              hosts: {
                type: "file",
                content: "127.0.0.1 localhost\n142.250.190.78 google.com\n140.82.121.3 github.com",
              },
            },
          },
          tmp: {
            type: "directory",
            contents: {},
          },
        },
      },
    }
  }

  // Migrate file system between versions
  function migrateFileSystem(savedData) {
    const oldVersion = savedData.version || 1
    const oldData = savedData.data || savedData

    // Version 1 to 2: Add example.md file
    if (oldVersion === 1) {
      // Make sure home/currentuser exists
      if (oldData["/"] && oldData["/"].contents.home && oldData["/"].contents.home.contents.currentuser) {
        // Add example.md if it doesn't exist
        if (!oldData["/"].contents.home.contents.currentuser.contents.example) {
          oldData["/"].contents.home.contents.currentuser.contents["example.md"] = {
            type: "file",
            content:
              "# Markdown Example\n\nThis is an example markdown file.\n\n## Features\n\n- **Bold text**\n- *Italic text*\n- `Code snippets`\n\n### Lists\n\n1. First item\n2. Second item\n3. Third item\n\n```\ncode block\n```\n\n> Blockquote example\n\n[Link example](https://example.com)",
          }
        }

        // Add hosts file if it doesn't exist
        if (!oldData["/"].contents.etc.contents.hosts) {
          oldData["/"].contents.etc.contents.hosts = {
            type: "file",
            content: "127.0.0.1 localhost\n142.250.190.78 google.com\n140.82.121.3 github.com",
          }
        }

        // Add tmp directory if it doesn't exist
        if (!oldData["/"].contents.tmp) {
          oldData["/"].contents.tmp = {
            type: "directory",
            contents: {},
          }
        }
      }
    }

    // Save migrated data
    saveFileSystem(oldData)

    return oldData
  }

  // Save file system to localStorage
  function saveFileSystem(fileSystem) {
    try {
      const saveData = {
        version: FILE_SYSTEM_VERSION,
        data: fileSystem,
      }
      localStorage.setItem("terminalFileSystem", JSON.stringify(saveData))
    } catch (e) {
      console.error("Error saving file system:", e)
      addToOutput(`<span class="error">Error saving file system: ${e.message}</span>`)
    }
  }

  // Load command history from localStorage if available
  if (localStorage.getItem("terminalHistory")) {
    try {
      state.commandHistory = JSON.parse(localStorage.getItem("terminalHistory"))
    } catch (e) {
      console.error("Error loading command history:", e)
      state.commandHistory = []
    }
  }

  // Load accessibility settings
  if (localStorage.getItem("terminalAccessibility")) {
    try {
      const accessibilitySettings = JSON.parse(localStorage.getItem("terminalAccessibility"))
      state.highContrastMode = accessibilitySettings.highContrastMode || false
      state.accessibilityMode = accessibilitySettings.accessibilityMode || false

      // Apply high contrast mode if enabled
      if (state.highContrastMode) {
        terminal.classList.add("high-contrast")
      }
    } catch (e) {
      console.error("Error loading accessibility settings:", e)
    }
  }

  // Update the prompt based on current user and path
  function updatePrompt() {
    const username = `<span class="username">${state.currentUser}</span>`
    const hostname = `<span class="hostname">terminal</span>`
    const path = `<span class="path">${state.currentPath}</span>`
    const symbol = `<span class="symbol">${state.currentUser === "root" ? "#" : "$"}</span>`

    promptElement.innerHTML = `${username}@${hostname}:${path}${symbol} `
  }

  // Focus input when terminal is clicked
  terminal.addEventListener("click", () => {
    // Don't focus if vim editor is active
    if (!state.vimState) {
      input.focus()
    }
  })

  // Handle key presses
  input.addEventListener("keydown", (e) => {
    // If vim editor is active, don't process terminal input
    if (state.vimState) return

    switch (e.key) {
      case "Enter":
        e.preventDefault()
        const command = input.value.trim()

        if (command) {
          // Add to history
          state.commandHistory.unshift(command)
          if (state.commandHistory.length > 50) {
            state.commandHistory.pop()
          }

          // Save to localStorage
          localStorage.setItem("terminalHistory", JSON.stringify(state.commandHistory))

          // Reset history navigation
          state.historyIndex = -1
          state.currentInput = ""

          // Display command with prompt
          addToOutput(`${promptElement.innerHTML}<span class="command">${escapeHtml(command)}</span>`)

          // Process command
          processCommand(command)

          // Clear input
          input.value = ""
        }
        break

      case "ArrowUp":
        e.preventDefault()
        navigateHistory("up")
        break

      case "ArrowDown":
        e.preventDefault()
        navigateHistory("down")
        break

      case "Tab":
        e.preventDefault()
        autocompleteCommand()
        break

      case "c":
        // Ctrl+C to cancel current command
        if (e.ctrlKey) {
          e.preventDefault()
          input.value = ""
          addToOutput("^C")
        }
        break

      case "l":
        // Ctrl+L to clear screen
        if (e.ctrlKey) {
          e.preventDefault()
          output.innerHTML = ""
        }
        break

      case "r":
        // Ctrl+R to search history (simplified)
        if (e.ctrlKey) {
          e.preventDefault()
          const searchTerm = prompt("Search history:")
          if (searchTerm) {
            const match = state.commandHistory.find((cmd) => cmd.includes(searchTerm))
            if (match) {
              input.value = match
            }
          }
        }
        break
    }
  })

  // Navigate command history
  function navigateHistory(direction) {
    if (state.commandHistory.length === 0) return

    if (direction === "up") {
      // Save current input if we're starting to navigate
      if (state.historyIndex === -1) {
        state.currentInput = input.value
      }

      state.historyIndex = Math.min(state.historyIndex + 1, state.commandHistory.length - 1)
      input.value = state.commandHistory[state.historyIndex]
    } else if (direction === "down") {
      state.historyIndex = Math.max(state.historyIndex - 1, -1)

      if (state.historyIndex === -1) {
        input.value = state.currentInput
      } else {
        input.value = state.commandHistory[state.historyIndex]
      }
    }

    // Move cursor to end of input
    const length = input.value.length
    setTimeout(() => {
      input.setSelectionRange(length, length)
    }, 0)
  }

  // Process command
  function processCommand(commandStr) {
    // Check for command piping
    if (commandStr.includes("|")) {
      return processPipedCommand(commandStr)
    }

    // Parse command and arguments
    const parts = commandStr.split(" ")
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1).filter((arg) => arg !== "")

    // Handle sudo command specially
    if (cmd === "sudo") {
      if (state.currentUser !== "root") {
        // In a real terminal, we would prompt for password
        // For simplicity, we'll just execute the command as root
        const originalUser = state.currentUser
        state.currentUser = "root"
        updatePrompt()

        // Execute the command
        const sudoCmd = args[0]
        const sudoArgs = args.slice(1)

        if (COMMANDS[sudoCmd]) {
          try {
            const result = COMMANDS[sudoCmd].action(sudoArgs, state)

            // Only add output if there is any
            if (result !== null && result !== undefined && result !== "") {
              addToOutput(escapeHtml(result))
            }
          } catch (error) {
            addToOutput(`<span class="error">Error executing command: ${error.message}</span>`)
          }
        } else if (sudoCmd) {
          addToOutput(`<span class="error">sudo: ${sudoCmd}: command not found</span>`)
        } else {
          addToOutput(`<span class="error">sudo: no command specified</span>`)
        }

        // Switch back to original user
        state.currentUser = originalUser
        updatePrompt()
        return
      }
    }

    // Execute regular command
    if (COMMANDS[cmd]) {
      try {
        const result = COMMANDS[cmd].action(args, state)

        // Special case for clear command
        if (cmd === "clear" && result === null) {
          output.innerHTML = ""
          return
        }

        // Only add output if there is any
        if (result !== null && result !== undefined && result !== "") {
          addToOutput(escapeHtml(result))
        }

        // Update prompt after command execution
        updatePrompt()

        // Save file system state if it was modified
        if (["mkdir", "touch", "rm", "rmdir", "cp", "mv", "echo", "useradd", "userdel", "vim"].includes(cmd)) {
          saveFileSystem(state.fileSystem)
        }
      } catch (error) {
        addToOutput(`<span class="error">Error executing command: ${error.message}</span>`)
      }
    } else if (cmd) {
      addToOutput(`<span class="error">${cmd}: command not found</span>`)
    }

    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight
  }

  // Process piped commands
  function processPipedCommand(commandStr) {
    const commands = commandStr.split("|").map((cmd) => cmd.trim())
    let output = ""

    for (let i = 0; i < commands.length; i++) {
      const parts = commands[i].split(" ")
      const cmd = parts[0].toLowerCase()
      const args = parts.slice(1).filter((arg) => arg !== "")

      // If this is not the first command, add the previous output as the last argument
      if (i > 0 && output) {
        // For commands that expect file input, we'll create a temporary file
        if (["cat", "grep", "markdown"].includes(cmd)) {
          // Create a temporary file with the output
          const tempFileName = `pipe_${Date.now()}.tmp`
          const tempFilePath = `/tmp/${tempFileName}`

          // Get the tmp directory
          const tmpDir = window.terminalHelpers.getPathObject("/tmp", state.fileSystem)
          if (tmpDir && tmpDir.type === "directory") {
            // Create the temp file
            tmpDir.contents[tempFileName] = {
              type: "file",
              content: output,
            }

            // Add the temp file path as an argument
            args.push(tempFilePath)
          } else {
            addToOutput(`<span class="error">Error: /tmp directory not found</span>`)
            return
          }
        } else {
          // For other commands, just add the output as an argument
          args.push(output)
        }
      }

      if (COMMANDS[cmd]) {
        try {
          const result = COMMANDS[cmd].action(args, state)
          output = result !== null && result !== undefined ? result : ""
        } catch (error) {
          addToOutput(`<span class="error">Error executing command: ${error.message}</span>`)
          return
        }
      } else {
        addToOutput(`<span class="error">${cmd}: command not found</span>`)
        return
      }
    }

    // Display the final output
    if (output) {
      addToOutput(escapeHtml(output))
    }

    // Clean up temporary files
    cleanupTempFiles()
  }

  // Clean up temporary files created during piping
  function cleanupTempFiles() {
    const tmpDir = window.terminalHelpers.getPathObject("/tmp", state.fileSystem)
    if (tmpDir && tmpDir.type === "directory") {
      // Find and remove pipe_*.tmp files
      Object.keys(tmpDir.contents).forEach((fileName) => {
        if (fileName.startsWith("pipe_") && fileName.endsWith(".tmp")) {
          delete tmpDir.contents[fileName]
        }
      })
    }
  }

  // Add text to output
  function addToOutput(html) {
    const line = document.createElement("div")
    line.className = "output-line"
    line.innerHTML = html

    // Add ARIA attributes for accessibility
    if (state.accessibilityMode) {
      line.setAttribute("role", "log")
      line.setAttribute("aria-live", "polite")
    }

    output.appendChild(line)

    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight
  }

  // Add raw HTML to output (for markdown rendering, etc.)
  function addRawHtmlToOutput(html) {
    const line = document.createElement("div")
    line.className = "output-line"
    line.innerHTML = html
    output.appendChild(line)

    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight
  }

  // Autocomplete command
  function autocompleteCommand() {
    const inputText = input.value.toLowerCase()

    if (inputText) {
      // Check if we're autocompleting a path
      if (inputText.includes(" ") && !inputText.endsWith(" ")) {
        autocompleteFilePath(inputText)
        return
      }

      const matches = Object.keys(COMMANDS).filter((cmd) => cmd.startsWith(inputText))

      if (matches.length === 1) {
        // Single match, autocomplete
        input.value = matches[0]

        // Move cursor to end of input
        const length = input.value.length
        setTimeout(() => {
          input.setSelectionRange(length, length)
        }, 0)
      } else if (matches.length > 1) {
        // Multiple matches, show options
        addToOutput(matches.join("  "))

        // Add current command line again
        addToOutput(`${promptElement.innerHTML}<span class="command">${escapeHtml(inputText)}</span>`)
      }
    }
  }

  // Autocomplete file path
  function autocompleteFilePath(inputText) {
    const parts = inputText.split(" ")
    const cmd = parts[0]
    const partialPath = parts[parts.length - 1]

    // Get the parent directory and partial filename
    const parentPath = window.terminalHelpers.getParentPath(partialPath, state.currentPath)
    const partialFileName = window.terminalHelpers.getBaseName(partialPath)

    // Get the parent directory object
    const parentDir = window.terminalHelpers.getPathObject(parentPath, state.fileSystem)

    if (parentDir && parentDir.type === "directory") {
      // Find matching files/directories
      const matches = Object.keys(parentDir.contents).filter((name) => name.startsWith(partialFileName))

      if (matches.length === 1) {
        // Single match, autocomplete
        const matchedName = matches[0]
        const isDir = parentDir.contents[matchedName].type === "directory"

        // Replace the partial path with the full path
        parts[parts.length - 1] =
          partialPath.substring(0, partialPath.length - partialFileName.length) + matchedName + (isDir ? "/" : "")
        input.value = parts.join(" ")

        // Move cursor to end of input
        const length = input.value.length
        setTimeout(() => {
          input.setSelectionRange(length, length)
        }, 0)
      } else if (matches.length > 1) {
        // Multiple matches, show options
        addToOutput(matches.join("  "))

        // Add current command line again
        addToOutput(`${promptElement.innerHTML}<span class="command">${escapeHtml(inputText)}</span>`)
      }
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (text === undefined || text === null) return ""

    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  // Make functions available to command modules
  window.terminalUtils = {
    addToOutput,
    addRawHtmlToOutput,
    updatePrompt,
    escapeHtml,
    saveFileSystem,
  }

  // Initial setup
  updatePrompt()
  input.focus()

  // Execute banner command on load
  processCommand("banner")
})

// Make helper functions available globally
window.terminalHelpers = {
  getPathObject: (path, fileSystem) => {
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
  },

  getParentPath: (path, currentPath) => {
    const normalizedPath = window.terminalHelpers.normalizePath(path, currentPath)
    const lastSlashIndex = normalizedPath.lastIndexOf("/")

    if (lastSlashIndex <= 0) {
      return "/"
    }

    return normalizedPath.substring(0, lastSlashIndex)
  },

  getBaseName: (path) => {
    const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path
    const components = normalizedPath.split("/")
    return components[components.length - 1]
  },

  normalizePath: (path, currentPath) => {
    // Handle absolute paths
    if (path.startsWith("/")) {
      // Path is already absolute
    } else if (path.startsWith("~/")) {
      // Replace ~ with /home/username
      path = `/home/${state?.currentUser || "currentuser"}${path.substring(1)}`
    } else if (currentPath) {
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
  },
}