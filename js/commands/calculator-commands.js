/**
 * Calculator commands
 */

export const calculatorCommands = {
  calc: {
    description: "Simple calculator",
    usage: "calc <expression>",
    action: (args, state) => {
      if (args.length === 0) {
        return startInteractiveCalculator(state)
      }

      const expression = args.join(" ")

      try {
        // Evaluate the expression
        const result = evaluateExpression(expression)
        return `${expression} = ${result}`
      } catch (error) {
        return `calc: error: ${error.message}`
      }
    },
  },

  bc: {
    description: "Alias for calc",
    usage: "bc <expression>",
    action: (args, state) => {
      return calculatorCommands.calc.action(args, state)
    },
  },
}

// Start an interactive calculator
function startInteractiveCalculator(state) {
  // Check if we're already in calculator mode
  if (state.calculatorMode) {
    return "Calculator already running. Type 'exit' to quit."
  }

  // Set calculator mode
  state.calculatorMode = true

  // Create calculator memory
  state.calculatorMemory = {
    variables: {},
    history: [],
  }

  // Add welcome message
  if (window.terminalUtils && window.terminalUtils.addToOutput) {
    window.terminalUtils.addToOutput(`
Simple Calculator
Type expressions to evaluate them.
Use 'vars' to see stored variables.
Use 'history' to see calculation history.
Type 'exit' to quit.
`)
  }

  // Override the command processor
  const originalProcessCommand = window.processCommand

  window.processCommand = (commandStr) => {
    if (commandStr.trim().toLowerCase() === "exit") {
      // Exit calculator mode
      state.calculatorMode = false
      window.processCommand = originalProcessCommand

      if (window.terminalUtils && window.terminalUtils.addToOutput) {
        window.terminalUtils.addToOutput("Exiting calculator mode.")
      }

      return
    }

    if (commandStr.trim().toLowerCase() === "vars") {
      // Show variables
      const vars = Object.keys(state.calculatorMemory.variables)

      if (vars.length === 0) {
        if (window.terminalUtils && window.terminalUtils.addToOutput) {
          window.terminalUtils.addToOutput("No variables defined.")
        }
      } else {
        let output = "Variables:\n"

        vars.forEach((v) => {
          output += `${v} = ${state.calculatorMemory.variables[v]}\n`
        })

        if (window.terminalUtils && window.terminalUtils.addToOutput) {
          window.terminalUtils.addToOutput(output)
        }
      }

      return
    }

    if (commandStr.trim().toLowerCase() === "history") {
      // Show history
      if (state.calculatorMemory.history.length === 0) {
        if (window.terminalUtils && window.terminalUtils.addToOutput) {
          window.terminalUtils.addToOutput("No calculation history.")
        }
      } else {
        let output = "Calculation History:\n"

        state.calculatorMemory.history.forEach((h, i) => {
          output += `${i + 1}: ${h}\n`
        })

        if (window.terminalUtils && window.terminalUtils.addToOutput) {
          window.terminalUtils.addToOutput(output)
        }
      }

      return
    }

    // Check for variable assignment
    const assignmentMatch = commandStr.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*(.+)$/)

    if (assignmentMatch) {
      const variableName = assignmentMatch[1]
      const expression = assignmentMatch[2]

      try {
        // Evaluate the expression
        const result = evaluateExpression(expression, state.calculatorMemory.variables)

        // Store the result
        state.calculatorMemory.variables[variableName] = result

        // Add to history
        state.calculatorMemory.history.push(`${variableName} = ${expression} = ${result}`)

        if (window.terminalUtils && window.terminalUtils.addToOutput) {
          window.terminalUtils.addToOutput(`${variableName} = ${result}`)
        }
      } catch (error) {
        if (window.terminalUtils && window.terminalUtils.addToOutput) {
          window.terminalUtils.addToOutput(`Error: ${error.message}`)
        }
      }

      return
    }

    // Evaluate expression
    try {
      // Evaluate the expression
      const result = evaluateExpression(commandStr, state.calculatorMemory.variables)

      // Add to history
      state.calculatorMemory.history.push(`${commandStr} = ${result}`)

      if (window.terminalUtils && window.terminalUtils.addToOutput) {
        window.terminalUtils.addToOutput(`${result}`)
      }
    } catch (error) {
      if (window.terminalUtils && window.terminalUtils.addToOutput) {
        window.terminalUtils.addToOutput(`Error: ${error.message}`)
      }
    }
  }

  return ""
}

// Evaluate a mathematical expression
function evaluateExpression(expression, variables = {}) {
  // Replace variables with their values
  let processedExpression = expression

  // Replace variables with their values
  Object.keys(variables).forEach((variable) => {
    const regex = new RegExp(`\\b${variable}\\b`, "g")
    processedExpression = processedExpression.replace(regex, variables[variable])
  })

  // Define safe math functions
  const mathFunctions = {
    abs: Math.abs,
    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,
    atan2: Math.atan2,
    ceil: Math.ceil,
    cos: Math.cos,
    exp: Math.exp,
    floor: Math.floor,
    log: Math.log,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    random: Math.random,
    round: Math.round,
    sin: Math.sin,
    sqrt: Math.sqrt,
    tan: Math.tan,
  }

  // Define constants
  const constants = {
    PI: Math.PI,
    E: Math.E,
  }

  // Create a safe evaluation context
  const context = {
    ...mathFunctions,
    ...constants,
  }

  // Check for unsafe code
  if (/[a-zA-Z0-9_$]+\s*$$.*$$/.test(processedExpression)) {
    // Check if it's a safe math function
    const functionMatch = processedExpression.match(/([a-zA-Z0-9_$]+)\s*\(/)
    if (functionMatch && !mathFunctions[functionMatch[1]]) {
      throw new Error(`Function '${functionMatch[1]}' is not allowed`)
    }
  }

  // Check for other unsafe patterns
  if (
    /eval|Function|setTimeout|setInterval|new\s+Function|constructor|prototype|__proto__|window|document|alert|console/.test(
      processedExpression,
    )
  ) {
    throw new Error("Expression contains unsafe code")
  }

  try {
    // Create a function to evaluate the expression in the context
    const evaluator = new Function(...Object.keys(context), `return ${processedExpression}`)

    // Call the function with the context values
    return evaluator(...Object.values(context))
  } catch (error) {
    throw new Error(`Invalid expression: ${error.message}`)
  }
}

// Make calculator commands available globally
window.calculatorCommands = calculatorCommands

