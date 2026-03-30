// src/scripts/workflow.ts
import {
  log as logger,
  proxyActivities,
  workflowInfo,
  continueAsNew
} from "@temporalio/workflow";

// src/scripts/serialization.ts
var mooseJsonEncode = (data) => {
  return JSON.stringify(data, (_, value) => {
    if (value instanceof Map) {
      return {
        __type: "Map",
        value: Array.from(value.entries())
      };
    }
    return value;
  });
};

// src/scripts/workflow.ts
var { getWorkflowByName, getTaskForWorkflow } = proxyActivities({
  startToCloseTimeout: "1 minutes",
  retry: {
    maximumAttempts: 1
  }
});
async function ScriptWorkflow(request, inputData) {
  const state = {
    completedSteps: [],
    currentStep: null,
    failedStep: null
  };
  const results = [];
  const workflowName = request.workflow_name;
  let currentData = inputData?.data || inputData || {};
  logger.info(
    `Starting workflow: ${workflowName} (mode: ${request.execution_mode}) with data: ${JSON.stringify(currentData)}`
  );
  try {
    currentData = JSON.parse(mooseJsonEncode(currentData));
    const workflow = await getWorkflowByName(workflowName);
    const task = request.execution_mode === "start" ? workflow.config.startingTask : await getTaskForWorkflow(workflowName, request.continue_from_task);
    const result = await handleTask(workflow, task, currentData, {
      originalWorkflowInput: inputData
    });
    results.push(...result);
    return results;
  } catch (error) {
    state.failedStep = workflowName;
    throw error;
  }
}
async function handleTask(workflow, task, inputData, ctx = {}) {
  const configTimeout = task.config.timeout;
  let taskTimeout;
  if (!configTimeout) {
    taskTimeout = "1h";
  } else if (configTimeout === "never") {
    taskTimeout = void 0;
  } else {
    taskTimeout = configTimeout;
  }
  const taskRetries = task.config.retries ?? 3;
  const maxAttempts = taskRetries + 1;
  const timeoutMessage = taskTimeout ? `with timeout ${taskTimeout}` : "with no timeout (unlimited)";
  logger.info(
    `Handling task ${task.name} ${timeoutMessage} and retries ${taskRetries}`
  );
  const activityOptions = {
    heartbeatTimeout: "10s",
    retry: {
      maximumAttempts: maxAttempts
    }
  };
  if (taskTimeout) {
    activityOptions.startToCloseTimeout = taskTimeout;
  } else {
    activityOptions.scheduleToCloseTimeout = "87600h";
  }
  const { executeTask } = proxyActivities(activityOptions);
  if (workflowInfo().continueAsNewSuggested) {
    logger.info(`ContinueAsNew suggested by Temporal before task ${task.name}`);
    return await continueAsNew(
      {
        workflow_name: workflow.name,
        execution_mode: "continue_as_new",
        continue_from_task: task.name
      },
      ctx.originalWorkflowInput
    );
  }
  const result = await executeTask(workflow, task, inputData);
  const results = [result];
  if (!task.config.onComplete?.length) {
    return results;
  }
  for (const childTask of task.config.onComplete) {
    const childResult = await handleTask(workflow, childTask, result, ctx);
    results.push(...childResult);
  }
  if (task.name.endsWith("_extract") && result && typeof result === "object" && "hasMore" in result && result.hasMore === true) {
    logger.info(`Extract task ${task.name} has more data, restarting chain...`);
    const nextBatchResults = await handleTask(workflow, task, null, ctx);
    results.push(...nextBatchResults);
  }
  return results;
}
export {
  ScriptWorkflow
};
//# sourceMappingURL=workflow.mjs.map