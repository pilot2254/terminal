/**
 * Tmux-like terminal multiplexer commands
 */

export const tmuxCommands = {
  tmux: {
    description: "Terminal multiplexer",
    usage: "tmux [command] [options]",
    action: (args, state) => {
      // Initialize tmux state if needed
      if (!state.tmux) {
        state.tmux = {
          sessions: {},
          activeSession: null,
          activeWindow: null,
        }
      }

      if (args.length === 0) {
        // Default behavior: create a new session if none exists, or attach to the first available session
        if (Object.keys(state.tmux.sessions).length === 0) {
          return createSession(["0"], state)
        } else if (!state.tmux.activeSession) {
          const sessionId = Object.keys(state.tmux.sessions)[0]
          return attachSession([sessionId], state)
        } else {
          return "tmux: already in a tmux session"
        }
      }

      const command = args[0].toLowerCase()
      const options = args.slice(1)

      switch (command) {
        case "new-session":
        case "new":
          return createSession(options, state)
        case "attach":
        case "a":
          return attachSession(options, state)
        case "detach":
        case "d":
          return detachSession(state)
        case "list-sessions":
        case "ls":
          return listSessions(state)
        case "kill-session":
          return killSession(options, state)
        case "split-window":
        case "split":
          return splitWindow(options, state)
        case "select-pane":
        case "select":
          return selectPane(options, state)
        case "resize-pane":
        case "resize":
          return resizePane(options, state)
        case "new-window":
          return newWindow(options, state)
        case "select-window":
          return selectWindow(options, state)
        case "rename-window":
          return renameWindow(options, state)
        case "kill-window":
          return killWindow(options, state)
        case "kill-pane":
          return killPane(options, state)
        default:
          return `tmux: unknown command: ${command}\nTry 'help tmux' for more information.`
      }
    },
  },
}

// Create a new tmux session
function createSession(options, state) {
  // Get session name
  const sessionName = options.length > 0 ? options[0] : `session-${Object.keys(state.tmux.sessions).length}`

  // Check if session already exists
  if (state.tmux.sessions[sessionName]) {
    return `tmux: session '${sessionName}' already exists`
  }

  // Create the session
  state.tmux.sessions[sessionName] = {
    windows: {},
    activeWindow: null,
  }

  // Create the first window
  const windowName = "window-0"
  state.tmux.sessions[sessionName].windows[windowName] = {
    name: windowName,
    panes: {},
    activePane: null,
    layout: "single",
  }

  // Create the first pane
  const paneId = "0"
  state.tmux.sessions[sessionName].windows[windowName].panes[paneId] = {
    id: paneId,
    content: "",
    history: [],
    currentPath: state.currentPath,
    currentUser: state.currentUser,
  }

  // Set active pane
  state.tmux.sessions[sessionName].windows[windowName].activePane = paneId

  // Set active window
  state.tmux.sessions[sessionName].activeWindow = windowName

  // Set active session
  state.tmux.activeSession = sessionName
  state.tmux.activeWindow = windowName

  // Create the tmux UI
  createTmuxUI(state)

  return `Session '${sessionName}' created`
}

// Attach to an existing tmux session
function attachSession(options, state) {
  if (options.length === 0) {
    return "tmux attach: missing session name"
  }

  const sessionName = options[0]

  // Check if session exists
  if (!state.tmux.sessions[sessionName]) {
    return `tmux: session '${sessionName}' not found`
  }

  // Set active session
  state.tmux.activeSession = sessionName

  // Set active window
  const session = state.tmux.sessions[sessionName]
  state.tmux.activeWindow = session.activeWindow

  // Create the tmux UI
  createTmuxUI(state)

  return `Attached to session '${sessionName}'`
}

// Detach from the current tmux session
function detachSession(state) {
  if (!state.tmux.activeSession) {
    return "tmux: not in a tmux session"
  }

  const sessionName = state.tmux.activeSession

  // Remove the tmux UI
  removeTmuxUI()

  // Clear active session
  state.tmux.activeSession = null
  state.tmux.activeWindow = null

  return `Detached from session '${sessionName}'`
}

// List all tmux sessions
function listSessions(state) {
  const sessions = state.tmux.sessions

  if (Object.keys(sessions).length === 0) {
    return "No tmux sessions"
  }

  let output = "Tmux sessions:\n"

  Object.keys(sessions).forEach((sessionName) => {
    const session = sessions[sessionName]
    const windowCount = Object.keys(session.windows).length
    const activeIndicator = sessionName === state.tmux.activeSession ? " (attached)" : ""

    output += `${sessionName}: ${windowCount} window(s)${activeIndicator}\n`
  })

  return output
}

// Kill a tmux session
function killSession(options, state) {
  if (options.length === 0) {
    return "tmux kill-session: missing session name"
  }

  const sessionName = options[0]

  // Check if session exists
  if (!state.tmux.sessions[sessionName]) {
    return `tmux: session '${sessionName}' not found`
  }

  // If killing the active session, remove the UI
  if (sessionName === state.tmux.activeSession) {
    removeTmuxUI()
    state.tmux.activeSession = null
    state.tmux.activeWindow = null
  }

  // Delete the session
  delete state.tmux.sessions[sessionName]

  return `Session '${sessionName}' killed`
}

// Split the current window
function splitWindow(options, state) {
  if (!state.tmux.activeSession) {
    return "tmux: not in a tmux session"
  }

  const session = state.tmux.sessions[state.tmux.activeSession]
  const window = session.windows[session.activeWindow]

  // Determine split direction
  const vertical = options.includes("-v") || options.includes("--vertical")

  // Get the current pane
  const currentPane = window.panes[window.activePane]

  // Create a new pane
  const newPaneId = Object.keys(window.panes).length.toString()
  window.panes[newPaneId] = {
    id: newPaneId,
    content: "",
    history: [],
    currentPath: currentPane.currentPath,
    currentUser: currentPane.currentUser,
  }

  // Update the layout
  if (vertical) {
    window.layout = window.layout === "single" ? "vertical" : window.layout
  } else {
    window.layout = window.layout === "single" ? "horizontal" : window.layout
  }

  // Set the new pane as active
  window.activePane = newPaneId

  // Update the UI
  updateTmuxUI(state)

  return `Pane ${newPaneId} created`
}

// Select a pane
function selectPane(options, state) {
  if (!state.tmux.activeSession) {
    return "tmux: not in a tmux session"
  }

  if (options.length === 0) {
    return "tmux select-pane: missing pane index"
  }

  const paneIndex = options[0]

  const session = state.tmux.sessions[state.tmux.activeSession]
  const window = session.windows[session.activeWindow]

  // Check if pane exists
  if (!window.panes[paneIndex]) {
    return `tmux: pane ${paneIndex} not found`
  }

  // Set active pane
  window.activePane = paneIndex

  // Update the UI
  updateTmuxUI(state)

  return `Pane ${paneIndex} selected`
}

// Resize a pane
function resizePane(options, state) {
  if (!state.tmux.activeSession) {
    return "tmux: not in a tmux session"
  }

  if (options.length < 2) {
    return "tmux resize-pane: missing options\nUsage: tmux resize-pane -[U|D|L|R] <size>"
  }

  const direction = options[0]
  const size = Number.parseInt(options[1])

  if (isNaN(size)) {
    return `tmux resize-pane: invalid size: ${options[1]}`
  }

  // Get the active pane element
  const paneElement = document.querySelector(".tmux-pane.active")

  if (!paneElement) {
    return "tmux: could not find active pane element"
  }

  // Resize the pane
  switch (direction) {
    case "-U":
    case "--up":
      paneElement.style.height = `${paneElement.offsetHeight - size}px`
      break
    case "-D":
    case "--down":
      paneElement.style.height = `${paneElement.offsetHeight + size}px`
      break
    case "-L":
    case "--left":
      paneElement.style.width = `${paneElement.offsetWidth - size}px`
      break
    case "-R":
    case "--right":
      paneElement.style.width = `${paneElement.offsetWidth + size}px`
      break
    default:
      return `tmux resize-pane: unknown direction: ${direction}`
  }

  return `Pane resized`
}

// Create a new window
function newWindow(options, state) {
  if (!state.tmux.activeSession) {
    return "tmux: not in a tmux session"
  }

  const session = state.tmux.sessions[state.tmux.activeSession]

  // Get window name
  const windowName = options.length > 0 ? options[0] : `window-${Object.keys(session.windows).length}`

  // Check if window already exists
  if (session.windows[windowName]) {
    return `tmux: window '${windowName}' already exists`
  }

  // Create the window
  session.windows[windowName] = {
    name: windowName,
    panes: {},
    activePane: null,
    layout: "single",
  }

  // Create the first pane
  const paneId = "0"
  session.windows[windowName].panes[paneId] = {
    id: paneId,
    content: "",
    history: [],
    currentPath: state.currentPath,
    currentUser: state.currentUser,
  }

  // Set active pane
  session.windows[windowName].activePane = paneId

  // Set active window
  session.activeWindow = windowName
  state.tmux.activeWindow = windowName

  // Update the UI
  updateTmuxUI(state)

  return `Window '${windowName}' created`
}

// Select a window
function selectWindow(options, state) {
  if (!state.tmux.activeSession) {
    return "tmux: not in a tmux session"
  }

  if (options.length === 0) {
    return "tmux select-window: missing window name"
  }

  const windowName = options[0]

  const session = state.tmux.sessions[state.tmux.activeSession]

  // Check if window exists
  if (!session.windows[windowName]) {
    return `tmux: window '${windowName}' not found`
  }

  // Set active window
  session.activeWindow = windowName
  state.tmux.activeWindow = windowName

  // Update the UI
  updateTmuxUI(state)

  return `Window '${windowName}' selected`
}

// Rename a window
function renameWindow(options, state) {
  if (!state.tmux.activeSession) {
    return "tmux: not in a tmux session"
  }

  if (options.length < 2) {
    return "tmux rename-window: missing arguments\nUsage: tmux rename-window <old-name> <new-name>"
  }

  const oldName = options[0]
  const newName = options[1]

  const session = state.tmux.sessions[state.tmux.activeSession]

  // Check if old window exists
  if (!session.windows[oldName]) {
    return `tmux: window '${oldName}' not found`
  }

  // Check if new name already exists
  if (session.windows[newName]) {
    return `tmux: window '${newName}' already exists`
  }

  // Rename the window
  session.windows[newName] = session.windows[oldName]
  session.windows[newName].name = newName
  delete session.windows[oldName]

  // Update active window reference if needed
  if (session.activeWindow === oldName) {
    session.activeWindow = newName
    state.tmux.activeWindow = newName
  }

  // Update the UI
  updateTmuxUI(state)

  return `Window renamed from '${oldName}' to '${newName}'`
}

// Kill a window
function killWindow(options, state) {
  if (!state.tmux.activeSession) {
    return "tmux: not in a tmux session"
  }

  if (options.length === 0) {
    return "tmux kill-window: missing window name"
  }

  const windowName = options[0]

  const session = state.tmux.sessions[state.tmux.activeSession]

  // Check if window exists
  if (!session.windows[windowName]) {
    return `tmux: window '${windowName}' not found`
  }

  // Delete the window
  delete session.windows[windowName]

  // If there are no more windows, kill the session
  if (Object.keys(session.windows).length === 0) {
    return killSession([state.tmux.activeSession], state)
  }

  // If killing the active window, switch to another window
  if (windowName === session.activeWindow) {
    session.activeWindow = Object.keys(session.windows)[0]
    state.tmux.activeWindow = session.activeWindow
  }

  // Update the UI
  updateTmuxUI(state)

  return `Window '${windowName}' killed`
}

// Kill a pane
function killPane(options, state) {
  if (!state.tmux.activeSession) {
    return "tmux: not in a tmux session"
  }

  if (options.length === 0) {
    return "tmux kill-pane: missing pane index"
  }

  const paneIndex = options[0]

  const session = state.tmux.sessions[state.tmux.activeSession]
  const window = session.windows[session.activeWindow]

  // Check if pane exists
  if (!window.panes[paneIndex]) {
    return `tmux: pane ${paneIndex} not found`
  }

  // If there's only one pane, kill the window
  if (Object.keys(window.panes).length === 1) {
    return killWindow([session.activeWindow], state)
  }

  // Delete the pane
  delete window.panes[paneIndex]

  // If killing the active pane, switch to another pane
  if (paneIndex === window.activePane) {
    window.activePane = Object.keys(window.panes)[0]
  }

  // Update the layout if needed
  if (Object.keys(window.panes).length === 1) {
    window.layout = "single"
  }

  // Update the UI
  updateTmuxUI(state)

  return `Pane ${paneIndex} killed`
}

// Create the tmux UI
function createTmuxUI(state) {
  // Hide the regular terminal
  const terminal = document.getElementById("terminal")
  const output = document.getElementById("terminal-output")
  const inputLine = document.getElementById("terminal-input-line")

  // Save the current terminal state
  state.terminalBackup = {
    output: output.innerHTML,
    inputLine: inputLine.style.display,
  }

  // Hide the input line
  inputLine.style.display = "none"

  // Create tmux container
  const tmuxContainer = document.createElement("div")
  tmuxContainer.className = "tmux-container"

  // Create tmux status bar
  const statusBar = document.createElement("div")
  statusBar.className = "tmux-status-bar"

  // Create tmux content area
  const contentArea = document.createElement("div")
  contentArea.className = "tmux-content"

  // Assemble the UI
  tmuxContainer.appendChild(contentArea)
  tmuxContainer.appendChild(statusBar)

  // Add to terminal
  output.innerHTML = ""
  output.appendChild(tmuxContainer)

  // Update the UI
  updateTmuxUI(state)
}

// Update the tmux UI
function updateTmuxUI(state) {
  if (!state.tmux.activeSession) {
    return
  }

  const session = state.tmux.sessions[state.tmux.activeSession]
  const window = session.windows[session.activeWindow]

  // Get the tmux container
  const tmuxContainer = document.querySelector(".tmux-container")

  if (!tmuxContainer) {
    return
  }

  // Update status bar
  const statusBar = tmuxContainer.querySelector(".tmux-status-bar")
  statusBar.innerHTML = ""

  // Add session name
  const sessionName = document.createElement("div")
  sessionName.className = "tmux-session-name"
  sessionName.textContent = `[${state.tmux.activeSession}]`
  statusBar.appendChild(sessionName)

  // Add windows
  const windowsContainer = document.createElement("div")
  windowsContainer.className = "tmux-windows"

  Object.keys(session.windows).forEach((windowName, index) => {
    const windowElement = document.createElement("div")
    windowElement.className = `tmux-window ${windowName === session.activeWindow ? "active" : ""}`
    windowElement.textContent = `${index}: ${windowName}`

    // Add click handler
    windowElement.addEventListener("click", () => {
      session.activeWindow = windowName
      state.tmux.activeWindow = windowName
      updateTmuxUI(state)
    })

    windowsContainer.appendChild(windowElement)
  })

  statusBar.appendChild(windowsContainer)

  // Add status info
  const statusInfo = document.createElement("div")
  statusInfo.className = "tmux-status-info"
  statusInfo.textContent = new Date().toLocaleTimeString()
  statusBar.appendChild(statusInfo)

  // Update content area
  const contentArea = tmuxContainer.querySelector(".tmux-content")
  contentArea.innerHTML = ""

  // Create panes based on layout
  switch (window.layout) {
    case "single":
      createSinglePane(contentArea, window, state)
      break
    case "horizontal":
      createHorizontalSplit(contentArea, window, state)
      break
    case "vertical":
      createVerticalSplit(contentArea, window, state)
      break
    default:
      createSinglePane(contentArea, window, state)
  }
}

// Create a single pane layout
function createSinglePane(container, window, state) {
  const paneId = Object.keys(window.panes)[0]
  const pane = window.panes[paneId]

  createPane(container, pane, window.activePane === paneId, state)
}

// Create a horizontal split layout
function createHorizontalSplit(container, window, state) {
  const paneIds = Object.keys(window.panes)

  paneIds.forEach((paneId) => {
    const pane = window.panes[paneId]
    const paneElement = createPane(container, pane, window.activePane === paneId, state)

    // Set height
    paneElement.style.height = `${100 / paneIds.length}%`
    paneElement.style.width = "100%"
  })
}

// Create a vertical split layout
function createVerticalSplit(container, window, state) {
  const paneIds = Object.keys(window.panes)

  paneIds.forEach((paneId) => {
    const pane = window.panes[paneId]
    const paneElement = createPane(container, pane, window.activePane === paneId, state)

    // Set width
    paneElement.style.width = `${100 / paneIds.length}%`
    paneElement.style.height = "100%"
  })
}

// Create a pane
function createPane(container, pane, isActive, state) {
  const paneElement = document.createElement("div")
  paneElement.className = `tmux-pane ${isActive ? "active" : ""}`
  paneElement.dataset.id = pane.id

  // Create pane content
  const paneContent = document.createElement("div")
  paneContent.className = "tmux-pane-content"

  // Create pane output
  const paneOutput = document.createElement("div")
  paneOutput.className = "tmux-pane-output"
  paneOutput.innerHTML = pane.content

  // Create pane input line
  const paneInputLine = document.createElement("div")
  paneInputLine.className = "tmux-pane-input-line"

  // Create prompt
  const panePrompt = document.createElement("span")
  panePrompt.className = "terminal-prompt"
  panePrompt.innerHTML = `<span class="username">${pane.currentUser}</span>@<span class="hostname">terminal</span>:<span class="path">${pane.currentPath}</span><span class="symbol">$</span> `

  // Create input
  const paneInput = document.createElement("input")
  paneInput.type = "text"
  paneInput.className = "terminal-input"
  paneInput.spellcheck = false

  // Add event listeners
  paneInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()

      const command = paneInput.value.trim()

      if (command) {
        // Add to history
        pane.history.unshift(command)

        // Display command with prompt
        paneOutput.innerHTML += `<div class="output-line">${panePrompt.innerHTML}<span class="command">${escapeHtml(command)}</span></div>`

        // Process command
        processCommand(command, pane, paneOutput, state)

        // Clear input
        paneInput.value = ""
      }
    }
  })

  // Add click handler to focus
  paneElement.addEventListener("click", () => {
    // Set active pane
    const session = state.tmux.sessions[state.tmux.activeSession]
    const window = session.windows[session.activeWindow]
    window.activePane = pane.id

    // Update UI
    updateTmuxUI(state)

    // Focus input
    paneInput.focus()
  })

  // Assemble pane
  paneInputLine.appendChild(panePrompt)
  paneInputLine.appendChild(paneInput)

  paneContent.appendChild(paneOutput)
  paneContent.appendChild(paneInputLine)

  paneElement.appendChild(paneContent)

  // Add to container
  container.appendChild(paneElement)

  // Focus input if active
  if (isActive) {
    paneInput.focus()
  }

  return paneElement
}

// Process a command in a tmux pane
function processCommand(command, pane, outputElement, state) {
  // Special case for tmux commands
  if (command.startsWith("tmux ")) {
    const args = command.split(" ").slice(1)
    const result = tmuxCommands.tmux.action(args, state)

    if (result) {
      outputElement.innerHTML += `<div class="output-line">${escapeHtml(result)}</div>`
    }

    return
  }

  // Parse command and arguments
  const parts = command.split(" ")
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1).filter((arg) => arg !== "")

  // Get the command function
  const commandFn = window.COMMANDS && window.COMMANDS[cmd]

  if (commandFn) {
    try {
      // Create a temporary state for the command
      const tempState = {
        ...state,
        currentPath: pane.currentPath,
        currentUser: pane.currentUser,
      }

      // Execute the command
      const result = commandFn.action(args, tempState)

      // Update pane state
      pane.currentPath = tempState.currentPath
      pane.currentUser = tempState.currentUser

      // Update prompt
      const promptElements = outputElement.parentElement.querySelectorAll(".terminal-prompt")
      promptElements.forEach((prompt) => {
        prompt.innerHTML = `<span class="username">${pane.currentUser}</span>@<span class="hostname">terminal</span>:<span class="path">${pane.currentPath}</span><span class="symbol">$</span> `
      })

      // Add output
      if (result !== null && result !== undefined && result !== "") {
        outputElement.innerHTML += `<div class="output-line">${escapeHtml(result)}</div>`
      }
    } catch (error) {
      outputElement.innerHTML += `<div class="output-line error">Error executing command: ${error.message}</div>`
    }
  } else if (cmd) {
    outputElement.innerHTML += `<div class="output-line error">${cmd}: command not found</div>`
  }

  // Scroll to bottom
  outputElement.scrollTop = outputElement.scrollHeight
}

// Remove the tmux UI
function removeTmuxUI() {
  // Get the tmux container
  const tmuxContainer = document.querySelector(".tmux-container")

  if (!tmuxContainer) {
    return
  }

  // Remove the container
  tmuxContainer.remove()

  // Restore the terminal
  const terminal = document.getElementById("terminal")
  const output = document.getElementById("terminal-output")
  const inputLine = document.getElementById("terminal-input-line")

  // Restore the output
  if (window.state && window.state.terminalBackup) {
    output.innerHTML = window.state.terminalBackup.output
    inputLine.style.display = window.state.terminalBackup.inputLine
  } else {
    inputLine.style.display = ""
  }

  // Focus the input
  document.getElementById("terminal-input").focus()
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (text === undefined || text === null) return ""

  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// Make tmux commands available globally
window.tmuxCommands = tmuxCommands

