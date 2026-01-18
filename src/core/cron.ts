import cron, { type TaskFn } from "node-cron";

export const registerCron = (timer: string, job: TaskFn) =>
  cron.schedule(timer, job);
