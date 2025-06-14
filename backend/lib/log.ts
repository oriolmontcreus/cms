import { cyan, yellow, red, magenta, dim, green } from 'colors';
import { formatTimestamp } from '@/lib/dateUtils.js';
import { ENV, Environment } from '@/constants/env.js';

export type LogType = 'INFO' | 'WARN' | 'ERROR' | 'UNAUTH' | 'DEBUG';

const color = {
    'INFO': cyan,
    'WARN': yellow,
    'UNAUTH': magenta,
    'ERROR': red,
    'DEBUG': green
}

export function log(type: LogType = 'INFO', ...msg: unknown[]) {
    if (type !== 'ERROR' && ENV === Environment.PRODUCTION) return;
    const timestamp = formatTimestamp(new Date());
    console.log(`[${dim(timestamp)}][${color[type](type)}]`, ...msg);
}