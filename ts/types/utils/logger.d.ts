declare namespace LambdaUtils {
  export interface LogEntry {
    component?: string;
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: { [key: string]: any };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event?: { [key: string]: any };
  }
}
