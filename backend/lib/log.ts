import colors from 'colors';
import { formatTimestamp } from '@/lib/dateUtils.js';
import { ENV, Environment } from '@/constants/env.js';

export type LogType = 'INFO' | 'WARN' | 'ERROR' | 'UNAUTH' | 'DEBUG';

const color = {
    'INFO': colors.cyan,
    'WARN': colors.yellow,
    'UNAUTH': colors.magenta,
    'ERROR': colors.red,
    'DEBUG': colors.green
}

export function log(type: LogType = 'INFO', ...msg: unknown[]) {
    if (type !== 'ERROR' && ENV === Environment.PRODUCTION) return;
    const timestamp = formatTimestamp(new Date());
    console.log(`[${colors.dim(timestamp)}][${color[type](type)}]`, ...msg);
}