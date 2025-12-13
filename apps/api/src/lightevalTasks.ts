import { spawn } from "child_process";

interface LightevalTaskListEntry {
  name: string;
  suite?: string;
  description?: string;
}

interface LightevalTaskInspectResult {
  name?: string;
  suite?: string;
  description?: string;
  config?: {
    dataset?: {
      hf_repo?: string;
      hf_subset?: string;
      evaluation_splits?: string[];
      hf_revision?: string;
    };
    default_fewshot?: number;
    metrics?: unknown[];
  };
  requirements?: string[];
}

function runLightevalCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("lighteval", args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => reject(err));
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        const error = new Error(`lighteval ${args.join(" ")} failed with code ${code}: ${stderr}`);
        reject(error);
      }
    });
  });
}

export async function listLightevalTasks(): Promise<LightevalTaskListEntry[]> {
  // Assumes lighteval supports JSON output for tasks list.
  const output = await runLightevalCommand(["tasks", "list", "--json"]);
  const data = JSON.parse(output);
  if (!Array.isArray(data)) return [];
  return data.map((entry) => ({
    name: entry.name ?? entry.task_name,
    suite: entry.suite,
    description: entry.description,
  }));
}

export async function inspectLightevalTask(taskName: string): Promise<LightevalTaskInspectResult | null> {
  // Assumes lighteval supports JSON output for tasks inspect.
  const output = await runLightevalCommand(["tasks", "inspect", taskName, "--json"]);
  const data = JSON.parse(output);
  return data as LightevalTaskInspectResult;
}
