import cron from "node-cron";

export interface CronAdapter {
  runJob(cronExpression: string, tasks: (() => void)[]): void;
}

export class NodeCron implements CronAdapter {
  runJob(cronExpression: string, tasks: (() => void)[]): void {
    cron.schedule(
      cronExpression,
      () => {
        tasks.forEach((task) => task());
      },
      { noOverlap: true },
    );
  }
}
