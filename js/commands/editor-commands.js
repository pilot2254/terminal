/**
 * Editor commands - Vim implementation
 */

export const editorCommands = {
  vim: {
    description: "Edit files with Vim",
    usage: "vim <file>",
    action: (args, state) => {
      if (args.length === 0) {
        return "vim: No file specified"
      }

      const filePath = args[0]
      const normalizedPath = window.terminalHelpers.normalizePath(filePath, state.currentPath)
      const parentPath = window.terminalHelpers.getParentPath(normalizedPath, state.currentPath)
      const fileName = window.terminalHelpers.getBaseName(normalizedPath)
      const parentDir = window.terminalHelpers.getPathObject(parentPath, state.fileSystem)

      // Check if parent directory exists
      if (!parentDir || parentDir.type !== "directory") {
        return `vim: Cannot open file in '${parentPath}': No such directory`
      }

      // Get or create the file
      let file
      if (parentDir.contents[fileName]) {
        if (parentDir.contents[fileName].type !== "file") {
          return `vim: Cannot edit '${filePath}': Is a directory`
        }
        file = parentDir.contents[fileName]
      } else {
        // Create a new file
        file = {
          type: "file",
          content: "",
        }
        parentDir.contents[fileName] = file
      }

      // Create the Vim editor UI
      createVimEditor(file, filePath, state)

      return ""
    },
  },

  nano: {
    description: "Simple editor (alias for vim)",
    usage: "nano <file>",
    action: (args, state) => {
      // Nano is just an alias for vim in this implementation
      return editorCommands.vim.action(args, state)
    },
  },
}

// Create the Vim editor UI
function createVimEditor(file, filePath, state) {
  // Get terminal elements
  const terminal = document.getElementById("terminal")
  const output = document.getElementById("terminal-output")
  const inputLine = document.getElementById("terminal-input-line")

  // Hide the input line while editing
  inputLine.style.display = "none"

  // Create editor container
  const editorContainer = document.createElement("div")
  editorContainer.className = "vim-editor"
  editorContainer.setAttribute("role", "textbox")
  editorContainer.setAttribute("aria-multiline", "true")
  editorContainer.setAttribute("aria-label", `Editing ${filePath}`)

  // Create editor content
  const editorContent = document.createElement("div")
  editorContent.className = "vim-editor-content"
  editorContent.contentEditable = "true"
  editorContent.textContent = file.content
  editorContent.spellcheck = false

  // Create status bar
  const statusBar = document.createElement("div")
  statusBar.className = "vim-status-bar"

  // Create mode indicator
  const modeIndicator = document.createElement("div")
  modeIndicator.className = "vim-mode"
  modeIndicator.textContent = "NORMAL"

  // Create file info
  const fileInfo = document.createElement("div")
  fileInfo.className = "vim-file-info"
  fileInfo.textContent = `"${filePath}" ${file.content.split("\n").length}L`

  // Assemble the editor
  statusBar.appendChild(modeIndicator)
  statusBar.appendChild(fileInfo)
  editorContainer.appendChild(editorContent)
  editorContainer.appendChild(statusBar)

  // Add to terminal
  output.appendChild(editorContainer)

  // Set up Vim state
  state.vimState = {
    mode: "normal",
    file: file,
    filePath: filePath,
    editorContent: editorContent,
    modeIndicator: modeIndicator,
    fileInfo: fileInfo,
    container: editorContainer,
  }

  // Focus the editor
  editorContent.focus()

  // Set up event listeners
  setupVimEventListeners(state)

  // Scroll to the editor
  terminal.scrollTop = terminal.scrollHeight
}

// Set up Vim event listeners
function setupVimEventListeners(state) {
  const { editorContent, modeIndicator } = state.vimState

  // Handle keydown events
  editorContent.addEventListener("keydown", (e) => {
    const { mode } = state.vimState

    // Handle escape key to exit insert mode
    if (e.key === "Escape") {
      if (mode === "insert") {
        state.vimState.mode = "normal"
        modeIndicator.textContent = "NORMAL"
        e.preventDefault()
      }
      return
    }

    // Handle normal mode commands
    if (mode === "normal") {
      switch (e.key) {
        case "i":
          // Enter insert mode
          state.vimState.mode = "insert"
          modeIndicator.textContent = "INSERT"
          e.preventDefault()
          break

        case ":":
          // Command mode
          promptVimCommand(state)
          e.preventDefault()
          break

        default:
          // Prevent typing in normal mode
          e.preventDefault()
          break
      }
    }

    // Update file info
    updateVimFileInfo(state)
  })

  // Handle input events to update the file content
  editorContent.addEventListener("input", () => {
    // Update the file content
    state.vimState.file.content = editorContent.textContent

    // Update file info
    updateVimFileInfo(state)
  })
}

// Update Vim file info
function updateVimFileInfo(state) {
  const { fileInfo, filePath, file, editorContent } = state.vimState
  const lineCount = editorContent.textContent.split("\n").length
  fileInfo.textContent = `"${filePath}" ${lineCount}L`
}

// Prompt for Vim command
function promptVimCommand(state) {
  const command = prompt(":")

  if (command) {
    executeVimCommand(command, state)
  }
}

// Execute Vim command
function executeVimCommand(command, state) {
  const { file, filePath } = state.vimState

  if (command === "q" || command === "q!") {
    // Quit without saving
    exitVimEditor(state, false)
  } else if (command === "w") {
    // Save file
    saveVimFile(state)
  } else if (command === "wq" || command === "x") {
    // Save and quit
    saveVimFile(state)
    exitVimEditor(state, true)
  } else {
    alert(`Unknown command: ${command}`)
  }
}

// Save Vim file
function saveVimFile(state) {
  const { file, editorContent } = state.vimState

  // Update file content
  file.content = editorContent.textContent

  // Save file system
  if (window.terminalUtils && window.terminalUtils.saveFileSystem) {
    window.terminalUtils.saveFileSystem(state.fileSystem)
  }
}

// Exit Vim editor
function exitVimEditor(state, saved) {
  // Remove the editor
  state.vimState.container.remove()

  // Show the input line
  document.getElementById("terminal-input-line").style.display = ""

  // Focus the input
  document.getElementById("terminal-input").focus()

  // Add message to output
  if (window.terminalUtils && window.terminalUtils.addToOutput) {
    if (saved) {
      window.terminalUtils.addToOutput(`"${state.vimState.filePath}" saved`)
    } else {
      window.terminalUtils.addToOutput(`Exited editor`)
    }
  }

  // Clear Vim state
  state.vimState = null
}

