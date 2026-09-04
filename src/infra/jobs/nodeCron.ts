import cron from "node-cron";

export interface CronAdapter {
  runJob(cronExpression: string, tasks: (() => void)[]): void;
}

export class NodeCronAdapter implements CronAdapter {
  runJob(cronExpression: string, tasks: (() => void)[]): void {
    cron.schedule(cronExpression, () => {
      tasks.forEach((task) => task());
    });
  }
}
const task1 = () => {
  console.log("Running a task 1");
};
const task2 = () => {
  console.log("Running another task 2");
};
const task3 = () => {
  console.log("Running yet another task 3");
};

const tasks = [task1, task2, task3];
const cronjob = new NodeCronAdapter();
cronjob.runJob("*/10 * * * * *", tasks);
