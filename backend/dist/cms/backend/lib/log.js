import colors from 'colors';
import { formatTimestamp } from '@/lib/dateUtils.js';
import { ENV, Environment } from '@/constants/env.js';
const color = {
    'INFO': colors.cyan,
    'WARN': colors.yellow,
    'UNAUTH': colors.magenta,
    'ERROR': colors.red,
    'DEBUG': colors.green
};
export function log(type = 'INFO', ...msg) {
    if (type !== 'ERROR' && ENV === Environment.PRODUCTION)
        return;
    const timestamp = formatTimestamp(new Date());
    console.log(`[${colors.dim(timestamp)}][${color[type](type)}]`, ...msg);
}
