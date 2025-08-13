import { Context } from 'hono';
import { log } from '@/lib/log.js';
import { GlobalVariablesService } from '@/src/services/globalVariables.service.js';

export class GlobalVariablesController {
    // Update global variables
    static async updateGlobalVariables(c: Context) {
        try {
            log('INFO', 'Updating global variables...');

            const body = await c.req.json();
            const globalVariables = await GlobalVariablesService.updateGlobalVariables(body);

            return c.json({ message: 'Global variables updated successfully', data: globalVariables });
        } catch (error) {
            console.error('Error updating global variables:', error);
            return c.json({ error: 'Failed to update global variables' }, 500);
        }
    }
}
