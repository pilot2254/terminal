/**
 * System commands
 */

export const systemCommands = {
  clear: {
    description: "Clear the terminal screen",
    usage: "clear",
    action: (args, state) => {
      return null // Special case handled in terminal.js
    },
  },

  banner: {
    description: "Display welcome banner",
    usage: "banner",
    action: (args, state) => {
      return `
 _____                    _             _   
|_   _|__ _ __ _ __ ___ (_)_ __   __ _| |  
  | |/ _ \\ '__| '_ \` _ \\| | '_ \\ / _\` | |  
  | |  __/ |  | | | | | | | | | | (_| | |  
  |_|\\___|_|  |_| |_| |_|_|_| |_|\\__,_|_|  
                                           
Welcome to the Terminal Website!
Type 'help' to see available commands.
`
    },
  },

  date: {
    description: "Display the current date and time",
    usage: "date",
    action: (args, state) => {
      return new Date().toString()
    },
  },

  uname: {
    description: "Print system information",
    usage: "uname [-a]",
    action: (args, state) => {
      if (args.length > 0 && args[0] === "-a") {
        return "WebOS 1.0 Terminal 1.0 Web Browser JavaScript"
      }
      return "WebOS"
    },
  },

  hostname: {
    description: "Show or set the system hostname",
    usage: "hostname",
    action: (args, state) => {
      return "terminal"
    },
  },

  reboot: {
    description: "Reboot the system (simulated)",
    usage: "reboot",
    action: (args, state) => {
      // Clear the terminal
      document.getElementById("terminal-output").innerHTML = ""

      // Show reboot message
      const rebootMessage = `
System is going down for reboot NOW!

Broadcast message from ${state.currentUser}@terminal
        (/dev/pts/0) at ${new Date().toLocaleTimeString()}...

The system is going down for reboot NOW!
`

      // Add reboot animation
      const output = document.getElementById("terminal-output")
      const rebootLine = document.createElement("div")
      rebootLine.className = "output-line"
      rebootLine.textContent = rebootMessage
      output.appendChild(rebootLine)

      // Simulate reboot after delay
      setTimeout(() => {
        output.innerHTML = ""
        const bootLine = document.createElement("div")
        bootLine.className = "output-line"
        bootLine.textContent = "System booting..."
        output.appendChild(bootLine)

        // Show banner after "reboot"
        setTimeout(() => {
          const bannerResult = systemCommands.banner.action([], state)
          const bannerLine = document.createElement("div")
          bannerLine.className = "output-line"
          bannerLine.textContent = bannerResult
          output.appendChild(bannerLine)

          // Focus the input after reboot
          document.getElementById("terminal-input").focus()
        }, 1000)
      }, 2000)

      return ""
    },
  },
}