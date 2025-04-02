/**
 * Cron job commands
 */

export const cronCommands = {
  crontab: {
    description: "Maintain crontab files",
    usage: "crontab [-l|-e|-r]",
    action: (args, state) => {
      if (args.length === 0) {
        return "crontab: missing operand\nTry 'crontab -l' to list jobs, 'crontab -e' to edit, or 'crontab -r' to remove all jobs."
      }

      const option = args[0]

      switch (option) {
        case "-l":
          return listCronJobs(state)
        case "-e":
          return editCronJobs(args.slice(1), state)
        case "-r":
          return removeCronJobs(state)
        default:
          return `crontab: invalid option -- '${option}'\nTry 'crontab -l' to list jobs, 'crontab -e' to edit, or 'crontab -r' to remove all jobs.`
      }
    },
  },

  cron: {
    description: "Schedule a command to run at specified times",
    usage: "cron <schedule> <command>",
    action: (args, state) => {
      if (args.length < 2) {
        return "cron: missing operand\nUsage: cron <schedule> <command>"
      }

      const schedule = args[0]
      const command = args.slice(1).join(" ")

      // Validate schedule
      if (!isValidCronSchedule(schedule)) {
        return `cron: invalid schedule format: ${schedule}\nFormat should be: minute hour day month weekday`
      }

      // Add the cron job
      const jobId = addCronJob(schedule, command, state)

      return `Cron job added with ID ${jobId}`
    },
  },
}

// List all cron jobs
function listCronJobs(state) {
  if (!state.cronJobs || state.cronJobs.length === 0) {
    return "No cron jobs found."
  }

  let output = "ID\tSchedule\t\tCommand\n"

  state.cronJobs.forEach((job) => {
    output += `${job.id}\t${job.schedule}\t${job.command}\n`
  })

  return output
}

// Edit cron jobs
function editCronJobs(args, state) {
  if (args.length === 0) {
    // Open the crontab file in the editor
    const crontabContent =
      state.cronJobs && state.cronJobs.length > 0
        ? state.cronJobs.map((job) => `${job.schedule} ${job.command}`).join("\n")
        : "# Edit this file to add or remove cron jobs\n# Format: minute hour day month weekday command"

    // Create a temporary file
    const tmpDir = window.terminalHelpers.getPathObject("/tmp", state.fileSystem)

    if (!tmpDir || tmpDir.type !== "directory") {
      return "crontab: cannot create temporary file"
    }

    // Create the crontab file
    tmpDir.contents["crontab.tmp"] = {
      type: "file",
      content: crontabContent,
    }

    // Open the file in the editor
    if (window.editorCommands && window.editorCommands.vim) {
      window.editorCommands.vim.action(["/tmp/crontab.tmp"], state)

      // Set up a callback to process the file when the editor is closed
      state.cronEditCallback = () => {
        const crontabFile = window.terminalHelpers.getPathObject("/tmp/crontab.tmp", state.fileSystem)

        if (crontabFile && crontabFile.type === "file") {
          // Parse the crontab file
          const lines = crontabFile.content.split("\n")
          const newJobs = []

          lines.forEach((line) => {
            // Skip comments and empty lines
            if (line.trim() === "" || line.trim().startsWith("#")) {
              return
            }

            // Parse the line
            const parts = line.trim().split(/\s+/)

            if (parts.length < 6) {
              if (window.terminalUtils && window.terminalUtils.addToOutput) {
                window.terminalUtils.addToOutput(`Warning: Invalid crontab entry: ${line}`)
              }
              return
            }

            const schedule = parts.slice(0, 5).join(" ")
            const command = parts.slice(5).join(" ")

            // Validate schedule
            if (!isValidCronSchedule(schedule)) {
              if (window.terminalUtils && window.terminalUtils.addToOutput) {
                window.terminalUtils.addToOutput(`Warning: Invalid schedule in crontab entry: ${line}`)
              }
              return
            }

            // Add the job
            newJobs.push({
              id: newJobs.length,
              schedule: schedule,
              command: command,
              nextRun: calculateNextRun(schedule),
            })
          })

          // Replace the cron jobs
          state.cronJobs = newJobs

          // Save the cron jobs
          saveCronJobs(state)

          if (window.terminalUtils && window.terminalUtils.addToOutput) {
            window.terminalUtils.addToOutput(`Crontab updated with ${newJobs.length} jobs`)
          }
        }
      }
    }

    return ""
  } else if (args.length >= 2 && args[0] === "-i") {
    // Edit a specific job
    const jobId = Number.parseInt(args[1])

    if (isNaN(jobId)) {
      return `crontab: invalid job ID: ${args[1]}`
    }

    const job = state.cronJobs && state.cronJobs.find((j) => j.id === jobId)

    if (!job) {
      return `crontab: no job with ID ${jobId}`
    }

    // TODO: Implement job editing
    return `Editing job ${jobId} not implemented yet`
  }

  return "crontab: invalid arguments for -e option"
}

// Remove all cron jobs
function removeCronJobs(state) {
  if (!state.cronJobs || state.cronJobs.length === 0) {
    return "No cron jobs to remove."
  }

  const count = state.cronJobs.length
  state.cronJobs = []

  // Save the cron jobs
  saveCronJobs(state)

  return `Removed ${count} cron jobs`
}

// Add a new cron job
function addCronJob(schedule, command, state) {
  // Initialize cron jobs if needed
  if (!state.cronJobs) {
    state.cronJobs = []
  }

  // Create the job
  const job = {
    id: state.cronJobs.length,
    schedule: schedule,
    command: command,
    nextRun: calculateNextRun(schedule),
  }

  // Add the job
  state.cronJobs.push(job)

  // Save the cron jobs
  saveCronJobs(state)

  // Start the cron timer if not already running
  startCronTimer(state)

  return job.id
}

// Save cron jobs to localStorage
function saveCronJobs(state) {
  try {
    localStorage.setItem("terminalCronJobs", JSON.stringify(state.cronJobs))
  } catch (e) {
    console.error("Error saving cron jobs:", e)
  }
}

// Load cron jobs from localStorage
function loadCronJobs(state) {
  try {
    const cronJobs = localStorage.getItem("terminalCronJobs")

    if (cronJobs) {
      state.cronJobs = JSON.parse(cronJobs)

      // Update next run times
      state.cronJobs.forEach((job) => {
        job.nextRun = calculateNextRun(job.schedule)
      })

      // Start the cron timer
      startCronTimer(state)
    }
  } catch (e) {
    console.error("Error loading cron jobs:", e)
    state.cronJobs = []
  }
}

// Start the cron timer
function startCronTimer(state) {
  // Clear any existing timer
  if (state.cronTimer) {
    clearInterval(state.cronTimer)
  }

  // Set up the timer to check for jobs every minute
  state.cronTimer = setInterval(() => {
    checkCronJobs(state)
  }, 60000) // Check every minute

  // Also check immediately
  checkCronJobs(state)
}

// Check for cron jobs that need to run
function checkCronJobs(state) {
  if (!state.cronJobs || state.cronJobs.length === 0) {
    return
  }

  const now = new Date()

  state.cronJobs.forEach((job) => {
    if (job.nextRun && job.nextRun <= now) {
      // Run the job
      runCronJob(job, state)

      // Calculate the next run time
      job.nextRun = calculateNextRun(job.schedule)
    }
  })

  // Save the updated jobs
  saveCronJobs(state)
}

// Run a cron job
function runCronJob(job, state) {
  if (window.terminalUtils && window.terminalUtils.addToOutput) {
    window.terminalUtils.addToOutput(`Running cron job: ${job.command}`)
  }

  // Parse the command
  const parts = job.command.split(" ")
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)

  // Get the command function
  const command = window.COMMANDS && window.COMMANDS[cmd]

  if (command) {
    try {
      // Execute the command
      const result = command.action(args, state)

      if (result !== null && result !== undefined && result !== "") {
        if (window.terminalUtils && window.terminalUtils.addToOutput) {
          window.terminalUtils.addToOutput(result)
        }
      }
    } catch (error) {
      if (window.terminalUtils && window.terminalUtils.addToOutput) {
        window.terminalUtils.addToOutput(`Error executing cron job: ${error.message}`)
      }
    }
  } else {
    if (window.terminalUtils && window.terminalUtils.addToOutput) {
      window.terminalUtils.addToOutput(`Cron job error: command not found: ${cmd}`)
    }
  }
}

// Calculate the next run time for a cron job
function calculateNextRun(schedule) {
  // Parse the schedule
  const parts = schedule.split(/\s+/)

  if (parts.length !== 5) {
    return null
  }

  const [minute, hour, day, month, weekday] = parts

  // Get the current time
  const now = new Date()
  const currentMinute = now.getMinutes()
  const currentHour = now.getHours()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentWeekday = now.getDay() // 0-6 (Sunday-Saturday)

  // Start with the current time
  const nextRun = new Date(now)

  // Set seconds to 0
  nextRun.setSeconds(0)
  nextRun.setMilliseconds(0)

  // Simple implementation for specific times
  // For a full implementation, we would need to handle ranges, lists, and steps

  // Set the minute
  if (minute === "*") {
    // Keep the current minute
  } else {
    const minuteValue = Number.parseInt(minute)

    if (!isNaN(minuteValue)) {
      if (minuteValue <= currentMinute) {
        // Move to the next hour
        nextRun.setHours(currentHour + 1)
      }

      nextRun.setMinutes(minuteValue)
    }
  }

  // Set the hour
  if (hour !== "*") {
    const hourValue = Number.parseInt(hour)

    if (!isNaN(hourValue)) {
      if (hourValue < currentHour || (hourValue === currentHour && nextRun.getMinutes() < currentMinute)) {
        // Move to the next day
        nextRun.setDate(currentDay + 1)
      }

      nextRun.setHours(hourValue)
    }
  }

  // This is a simplified implementation
  // A full implementation would need to handle more complex schedules

  return nextRun
}

// Validate a cron schedule
function isValidCronSchedule(schedule) {
  // Simple validation
  const parts = schedule.split(/\s+/)

  if (parts.length !== 5) {
    return false
  }

  // Check each part
  for (const part of parts) {
    if (part !== "*" && !/^\d+$/.test(part)) {
      // For a full implementation, we would need to handle ranges, lists, and steps
      return false
    }
  }

  return true
}

// Make cron commands available globally
window.cronCommands = {
  loadCronJobs: (state) => {
    try {
      const cronJobs = localStorage.getItem("terminalCronJobs")

      if (cronJobs) {
        state.cronJobs = JSON.parse(cronJobs)

        // Update next run times
        state.cronJobs.forEach((job) => {
          job.nextRun = calculateNextRun(job.schedule)
        })

        // Start the cron timer
        startCronTimer(state)
      }
    } catch (e) {
      console.error("Error loading cron jobs:", e)
      state.cronJobs = []
    }
  },
}

