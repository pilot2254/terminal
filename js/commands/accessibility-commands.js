/**
 * Accessibility commands
 */

export const accessibilityCommands = {
  contrast: {
    description: "Toggle high contrast mode",
    usage: "contrast",
    action: (args, state) => {
      // Toggle high contrast mode
      state.highContrastMode = !state.highContrastMode

      // Apply high contrast mode
      const terminal = document.getElementById("terminal")
      if (state.highContrastMode) {
        terminal.classList.add("high-contrast")
      } else {
        terminal.classList.remove("high-contrast")
      }

      // Save accessibility settings
      saveAccessibilitySettings(state)

      return `High contrast mode ${state.highContrastMode ? "enabled" : "disabled"}`
    },
  },

  a11y: {
    description: "Toggle accessibility features",
    usage: "a11y",
    action: (args, state) => {
      // Apply accessibility mode
      const terminal = document.getElementById("terminal")
      const output = document.getElementById("terminal-output")
      const input = document.getElementById("terminal-input")
      const outputLines = output.querySelectorAll(".output-line")

      if (state.accessibilityMode) {
        // Add ARIA attributes
        terminal.setAttribute("role", "application")
        terminal.setAttribute("aria-label", "Terminal emulator")
        output.setAttribute("role", "log")
        output.setAttribute("aria-live", "polite")
        input.setAttribute("aria-label", "Terminal input")

        // Update existing output lines
        outputLines.forEach((line) => {
          line.setAttribute("role", "log")
        })

        // Add skip to content link
        const skipLink = document.createElement("a")
        skipLink.href = "#terminal-input"
        skipLink.className = "skip-to-content"
        skipLink.textContent = "Skip to terminal input"
        document.body.insertBefore(skipLink, terminal)
      } else {
        // Remove ARIA attributes
        terminal.removeAttribute("role")
        terminal.removeAttribute("aria-label")
        output.removeAttribute("role")
        output.removeAttribute("aria-live")
        input.removeAttribute("aria-label")

        // Update existing output lines
        outputLines.forEach((line) => {
          line.removeAttribute("role")
        })

        // Remove skip to content link
        const skipLink = document.querySelector(".skip-to-content")
        if (skipLink) {
          skipLink.remove()
        }
      }

      // Save accessibility settings
      saveAccessibilitySettings(state)

      return `Accessibility mode ${state.accessibilityMode ? "enabled" : "disabled"}`
    },
  },
}

// Save accessibility settings
function saveAccessibilitySettings(state) {
  try {
    const settings = {
      highContrastMode: state.highContrastMode,
      accessibilityMode: state.accessibilityMode,
    }
    localStorage.setItem("terminalAccessibility", JSON.stringify(settings))
  } catch (e) {
    console.error("Error saving accessibility settings:", e)
  }
}

