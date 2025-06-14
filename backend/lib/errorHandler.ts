import { Context } from "hono";
import { log } from '@/lib/log.js';
import ExtendedError from '@/errors/ExtendedError.js';
import { UNAUTHORIZED } from '@/constants/http.js';
import { red } from "colors";
import { ContentfulStatusCode } from "hono/utils/http-status";

export const errorHandler = (err: Error, c: Context) => {
  const source = `${c.req.method} ${new URL(c.req.url).pathname}`;
  let logMessage = `${source} \n${err.message}\n`;

  if (err.stack && !(err instanceof ExtendedError)) {
    logMessage += `\n${red('Not expected error')} at: ${err.stack}`;
  }

  const logLevel = err instanceof ExtendedError
    ? (err.statusCode === UNAUTHORIZED ? 'UNAUTH' : 'WARN')
    : 'ERROR';
  log(logLevel, logMessage);

  const statusCode = err instanceof ExtendedError ? err.statusCode : 500;
  const resMsg = err instanceof ExtendedError ? err.message : 'Internal Server Error';

  return c.text(resMsg, statusCode as ContentfulStatusCode);
};