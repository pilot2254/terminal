/**
 * User management commands
 */

export const userCommands = {
  whoami: {
    description: "Print the current user name",
    usage: "whoami",
    action: (args, state) => {
      return state.currentUser
    },
  },

  useradd: {
    description: "Create a new user",
    usage: "useradd <username>",
    action: (args, state) => {
      if (state.currentUser !== "root") {
        return "useradd: Permission denied. Only root can add users."
      }

      if (args.length === 0) {
        return "useradd: missing operand"
      }

      const username = args[0]

      // Validate username
      if (!/^[a-z_][a-z0-9_-]*$/.test(username)) {
        return "useradd: invalid username. Username must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens."
      }

      // Check if user already exists
      const etcPasswd = window.terminalHelpers.getPathObject("/etc/passwd", state.fileSystem)
      if (etcPasswd && etcPasswd.content.includes(`${username}:`)) {
        return `useradd: user '${username}' already exists`
      }

      // Create home directory
      const homeDir = window.terminalHelpers.getPathObject("/home", state.fileSystem)
      if (!homeDir) {
        return "useradd: /home directory does not exist"
      }

      // Check if home directory already exists
      if (homeDir.contents[username]) {
        return `useradd: home directory for user '${username}' already exists`
      }

      // Create user's home directory with proper permissions
      homeDir.contents[username] = {
        type: "directory",
        contents: {
          "welcome.txt": {
            type: "file",
            content: `Welcome, ${username}!\nThis is your home directory.`,
          },
          "example.md": {
            type: "file",
            content:
              "# Welcome\n\nThis is your personal markdown file.\n\n## Getting Started\n\n- Try using the `ls` command to see files\n- Use `vim` to edit files\n- Use `markdown` to render this file",
          },
        },
      }

      // Update /etc/passwd
      if (etcPasswd) {
        etcPasswd.content += `\n${username}:x:1001:1001:${username}:/home/${username}:/bin/bash`
      }

      return `User '${username}' created successfully.`
    },
  },

  userdel: {
    description: "Delete a user",
    usage: "userdel [-r] <username>",
    action: (args, state) => {
      if (state.currentUser !== "root") {
        return "userdel: Permission denied. Only root can delete users."
      }

      let removeHome = false
      let username = ""

      // Parse arguments
      if (args.length === 0) {
        return "userdel: missing operand"
      } else if (args[0] === "-r") {
        removeHome = true
        if (args.length < 2) {
          return "userdel: missing operand"
        }
        username = args[1]
      } else {
        username = args[0]
      }

      // Cannot delete root
      if (username === "root") {
        return "userdel: cannot delete root user"
      }

      // Cannot delete current user
      if (username === state.currentUser) {
        return "userdel: cannot delete the current user"
      }

      // Check if user exists
      const etcPasswd = window.terminalHelpers.getPathObject("/etc/passwd", state.fileSystem)
      if (!etcPasswd || !etcPasswd.content.includes(`${username}:`)) {
        return `userdel: user '${username}' does not exist`
      }

      // Remove home directory if requested
      if (removeHome) {
        const homeDir = window.terminalHelpers.getPathObject("/home", state.fileSystem)
        if (homeDir && homeDir.contents[username]) {
          delete homeDir.contents[username]
        }
      }

      // Update /etc/passwd
      if (etcPasswd) {
        const lines = etcPasswd.content.split("\n")
        const newLines = lines.filter((line) => !line.startsWith(`${username}:`))
        etcPasswd.content = newLines.join("\n")
      }

      return `User '${username}' deleted successfully.`
    },
  },

  passwd: {
    description: "Change user password (simulated)",
    usage: "passwd [username]",
    action: (args, state) => {
      const username = args[0] || state.currentUser

      // Check if user exists
      const etcPasswd = window.terminalHelpers.getPathObject("/etc/passwd", state.fileSystem)
      if (!etcPasswd || !etcPasswd.content.includes(`${username}:`)) {
        return `passwd: user '${username}' does not exist`
      }

      // In a real system, we would prompt for password
      // For this simulation, we'll just pretend it worked
      return `Password for user '${username}' changed successfully (simulated).`
    },
  },

  su: {
    description: "Switch user",
    usage: "su [username]",
    action: (args, state) => {
      const username = args[0] || "root"

      // Check if user exists
      const etcPasswd = window.terminalHelpers.getPathObject("/etc/passwd", state.fileSystem)
      if (!etcPasswd || !etcPasswd.content.includes(`${username}:`)) {
        return `su: user '${username}' does not exist`
      }

      // In a real system, we would prompt for password
      // For this simulation, we'll just switch user
      state.currentUser = username

      // If switching to a different user, change to their home directory
      if (username !== "root") {
        state.previousPath = state.currentPath
        state.currentPath = `/home/${username}`
      } else {
        state.previousPath = state.currentPath
        state.currentPath = "/root"
      }

      return ""
    },
  },

  users: {
    description: "List users on the system",
    usage: "users",
    action: (args, state) => {
      const etcPasswd = window.terminalHelpers.getPathObject("/etc/passwd", state.fileSystem)
      if (!etcPasswd) {
        return "users: cannot access /etc/passwd"
      }

      const lines = etcPasswd.content.split("\n")
      const users = lines.map((line) => line.split(":")[0])

      return users.join(" ")
    },
  },
}

