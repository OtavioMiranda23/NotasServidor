import { log } from "console";
import pino from "pino";

export default class Logger {
  logger: pino.Logger | undefined;
  constructor(path: string) {
    try {
      this.logger = pino({ level: "info" }, pino.destination(path));
    } catch (error) {
      log("Erro ao criar logger:", error);
    }
  }
  public info(message: string) {
    if (!this.logger) return;
    try {
      this.logger.info(message);
    } catch (error) {
      console.log("Erro ao registrar info:", error);
    }
  }

  public error(message: string, err?: any) {
    if (!this.logger) return;
    try {
      this.logger.error({ err }, message);
    } catch (error) {
      console.log("Erro ao registrar error:", error);
    }
  }
}
