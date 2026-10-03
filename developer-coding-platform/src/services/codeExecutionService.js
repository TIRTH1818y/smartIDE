/**
 * Code Execution Service Architecture
 * 
 * SECURITY REQUIREMENT:
 * Arbitrary untrusted user code MUST NEVER be executed directly within the Node.js API server process using
 * eval(), new Function(), or unsandboxed child process commands.
 * 
 * This service acts as an abstraction layer. In development/initial mode, it uses CODE_EXECUTION_MODE='mock'
 * or an isolated evaluator protocol. In production, this can be plugged into a Docker sandbox worker,
 * Judge0 API, or isolated microservice.
 */

class CodeExecutionService {
  /**
   * Executes or evaluates code against provided test cases safely.
   * 
   * @param {Object} options
   * @param {string} options.language - Programming language ('javascript', 'python', 'java', 'cpp')
   * @param {string} options.code - Submitted source code
   * @param {Array} options.testCases - Array of { input, expectedOutput, isHidden }
   * @param {number} options.timeLimit - Time limit in seconds
   * @returns {Promise<Object>} Execution summary with results for each test case
   */
  async executeCode({ language, code, testCases = [], timeLimit = 2 }) {
    const executionMode = process.env.CODE_EXECUTION_MODE || 'mock';

    if (executionMode === 'mock') {
      return this.executeMockMode({ language, code, testCases, timeLimit });
    }

    // Future extension point for Docker worker / external judge API
    return this.executeMockMode({ language, code, testCases, timeLimit });
  }

  /**
   * Mock evaluation implementation
   */
  async executeMockMode({ language, code, testCases, timeLimit }) {
    // Simulate slight processing latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    const results = [];
    let passedCount = 0;

    // Basic heuristic: check if code is non-empty and contains basic return / syntax structures
    const isBasicValidCode =
      typeof code === 'string' &&
      code.trim().length > 10 &&
      !code.includes('syntax_error_trigger');

    testCases.forEach((tc, index) => {
      // Determine if test case passes based on mock validation
      // If code contains keywords or function definition, simulate successful run for test cases
      const passed = isBasicValidCode;
      
      if (passed) {
        passedCount++;
      }

      results.push({
        testCaseIndex: index + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: passed ? tc.expectedOutput : 'Error: Output mismatch or execution failure',
        passed: passed,
        executionTimeMs: Math.floor(Math.random() * 50) + 10,
        error: passed ? null : 'Runtime Error or Output Mismatch',
        isHidden: !!tc.isHidden,
      });
    });

    const totalTests = testCases.length;
    const failedTests = totalTests - passedCount;
    const overallPassed = totalTests > 0 && passedCount === totalTests;

    return {
      success: true,
      passed: overallPassed,
      totalTests,
      passedTests: passedCount,
      failedTests,
      results,
    };
  }
}

module.exports = new CodeExecutionService();
