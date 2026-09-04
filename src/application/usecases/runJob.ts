import { CronAdapter } from "../../infra/jobs/nodeCron";

class RunJob {
  constructor(private cronAdapter: CronAdapter) {}

  public run(cronExpression: string, tasks: (() => void)[]): void {
    this.cronAdapter.runJob(cronExpression, tasks);
  }
}
