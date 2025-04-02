/**
 * Job Control commands
 */

export const jobCommands = {
  jobs: {
    description: "List active jobs",
    usage: "jobs",
    action: (args, state) => {
      if (state.jobs.length === 0) {
        return "No active jobs."
      }

      let output = "Job ID\tStatus\tCommand\n"

      state.jobs.forEach((job) => {
        output += `[${job.id}]\t${job.status}\t${job.command}\n`
      })

      return output
    },
  },

  bg: {
    description: "Resume job in the background",
    usage: "bg [job_id]",
    action: (args, state) => {
      // If no job ID is provided, use the most recent job
      const jobId = args.length > 0 ? Number.parseInt(args[0]) : state.jobs.length - 1

      if (isNaN(jobId)) {
        return `bg: invalid job ID: ${args[0]}`
      }

      const job = state.jobs.find((j) => j.id === jobId)

      if (!job) {
        return `bg: no job with ID ${jobId}`
      }

      if (job.status === "running") {
        return `bg: job ${jobId} already running`
      }

      // Resume the job in the background
      job.status = "running"

      // If the job has a timer, restart it
      if (job.timer) {
        job.timer = setInterval(() => {
          job.progress += 10

          if (job.progress >= 100) {
            clearInterval(job.timer)
            job.status = "done"
            job.timer = null

            // Add output to terminal
            if (window.terminalUtils && window.terminalUtils.addToOutput) {
              window.terminalUtils.addToOutput(`[${job.id}] Done: ${job.command}`)
            }
          }
        }, 1000)
      }

      return `[${job.id}] ${job.command} &`
    },
  },

  fg: {
    description: "Bring job to the foreground",
    usage: "fg [job_id]",
    action: (args, state) => {
      // If no job ID is provided, use the most recent job
      const jobId = args.length > 0 ? Number.parseInt(args[0]) : state.jobs.length - 1

      if (isNaN(jobId)) {
        return `fg: invalid job ID: ${args[0]}`
      }

      const job = state.jobs.find((j) => j.id === jobId)

      if (!job) {
        return `fg: no job with ID ${jobId}`
      }

      // Bring the job to the foreground
      job.status = "foreground"

      // If the job has a timer, restart it
      if (job.timer) {
        clearInterval(job.timer)

        // Create a progress indicator
        const progressInterval = setInterval(() => {
          if (window.terminalUtils && window.terminalUtils.addToOutput) {
            window.terminalUtils.addToOutput(`${job.command}: ${job.progress}% complete`)
          }

          job.progress += 10

          if (job.progress >= 100) {
            clearInterval(progressInterval)
            job.status = "done"

            // Remove the job from the list
            const jobIndex = state.jobs.findIndex((j) => j.id === jobId)
            if (jobIndex !== -1) {
              state.jobs.splice(jobIndex, 1)
            }

            // Add completion message
            if (window.terminalUtils && window.terminalUtils.addToOutput) {
              window.terminalUtils.addToOutput(`${job.command}: 100% complete`)
              window.terminalUtils.addToOutput(`${job.command} completed successfully`)
            }
          }
        }, 1000)
      }

      return `[${job.id}] ${job.command}`
    },
  },

  kill: {
    description: "Kill a job",
    usage: "kill <job_id>",
    action: (args, state) => {
      if (args.length === 0) {
        return "kill: missing job ID"
      }

      const jobId = Number.parseInt(args[0])

      if (isNaN(jobId)) {
        return `kill: invalid job ID: ${args[0]}`
      }

      const jobIndex = state.jobs.findIndex((j) => j.id === jobId)

      if (jobIndex === -1) {
        return `kill: no job with ID ${jobId}`
      }

      const job = state.jobs[jobIndex]

      // Clear any timers
      if (job.timer) {
        clearInterval(job.timer)
      }

      // Remove the job from the list
      state.jobs.splice(jobIndex, 1)

      return `[${jobId}] Terminated: ${job.command}`
    },
  },

  sleep: {
    description: "Sleep for a specified number of seconds",
    usage: "sleep <seconds> [&]",
    action: async (args, state) => {
      if (args.length === 0) {
        return "sleep: missing operand"
      }

      const seconds = Number.parseInt(args[0])

      if (isNaN(seconds) || seconds <= 0) {
        return `sleep: invalid time interval '${args[0]}'`
      }

      // Check if the command should run in the background
      const background = args.includes("&") || args[args.length - 1] === "&"

      if (background) {
        // Create a new background job
        const jobId = state.jobs.length

        const job = {
          id: jobId,
          command: `sleep ${seconds}`,
          status: "running",
          progress: 0,
          timer: null,
        }

        // Start the timer
        job.timer = setInterval(() => {
          job.progress += 100 / seconds

          if (job.progress >= 100) {
            clearInterval(job.timer)
            job.status = "done"
            job.timer = null

            // Add output to terminal
            if (window.terminalUtils && window.terminalUtils.addToOutput) {
              window.terminalUtils.addToOutput(`[${job.id}] Done: ${job.command}`)
            }
          }
        }, 1000)

        // Add the job to the list
        state.jobs.push(job)

        return `[${jobId}] ${job.command} &`
      } else {
        // Run in the foreground
        try {
          // Show progress
          for (let i = 1; i <= seconds; i++) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            if (window.terminalUtils && window.terminalUtils.addToOutput) {
              window.terminalUtils.addToOutput(`sleep: ${i}/${seconds} seconds elapsed`)
            }
          }

          return `sleep: completed after ${seconds} seconds`
        } catch (error) {
          return `sleep: error: ${error.message}`
        }
      }
    },
  },
}

// Make job commands available globally
window.jobCommands = jobCommands

