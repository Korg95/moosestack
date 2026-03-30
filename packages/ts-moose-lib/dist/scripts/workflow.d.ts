interface WorkflowRequest {
    workflow_name: string;
    execution_mode: "start" | "continue_as_new";
    continue_from_task?: string;
}
declare function ScriptWorkflow(request: WorkflowRequest, inputData?: any): Promise<any[]>;

export { ScriptWorkflow };
