import type { ValidationError } from './validation';

export interface NavigationTarget {
    elementId: string;
    tabName?: string;
    componentId: string;
    isInRepeater?: boolean;
    repeaterIndex?: number;
}

/**
 * Generates a unique element ID for a form field
 */
export function generateFieldId(componentId: string, fieldName: string, repeaterIndex?: number): string {
    if (repeaterIndex !== undefined) {
        return `${componentId}-${fieldName}-${repeaterIndex}`;
    }
    return `${componentId}-${fieldName}`;
}

/**
 * Generates navigation target information from a validation error
 */
export function getNavigationTarget(error: ValidationError): NavigationTarget {
    const fieldName = error.field.split('.').pop() || error.field;
    const elementId = generateFieldId(
        error.componentId || 'unknown',
        fieldName,
        error.repeaterIndex
    );

    return {
        elementId,
        tabName: error.tabName,
        componentId: error.componentId || 'unknown',
        isInRepeater: error.isInRepeater,
        repeaterIndex: error.repeaterIndex
    };
}

/**
 * Scrolls to and focuses a specific field element
 */
export function scrollToField(elementId: string, smooth = true): Promise<void> {
    return new Promise((resolve) => {
        // Find the target element
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element with ID ${elementId} not found`);
            resolve();
            return;
        }

        // Add validation target attribute for styling
        element.setAttribute('data-validation-target', 'true');

        // Scroll to element
        element.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto',
            block: 'center',
            inline: 'nearest'
        });

        // Focus the element after scroll
        setTimeout(() => {
            // Try to focus the input element
            const input = element.querySelector('input, textarea, select, button') as HTMLElement;
            if (input && typeof input.focus === 'function') {
                input.focus();
            } else if (typeof element.focus === 'function') {
                element.focus();
            }

            // Add visual highlight effect
            element.style.transition = 'box-shadow 0.3s ease';
            element.style.boxShadow = '0 0 0 2px hsl(var(--ring))';

            // Remove highlight after animation
            setTimeout(() => {
                element.style.boxShadow = '';
                element.removeAttribute('data-validation-target');
            }, 2000);

            resolve();
        }, smooth ? 300 : 50);
    });
}

/**
 * Expands a collapsed component if it contains the target field
 */
export function expandComponentIfNeeded(componentId: string): void {
    // Dispatch custom event to expand the component
    const event = new CustomEvent('expandComponent', {
        detail: { componentId }
    });
    document.dispatchEvent(event);
}

/**
 * Activates a specific tab if the field is within that tab
 */
export function activateTabIfNeeded(tabName: string, componentId: string): void {
    if (!tabName) return;

    console.log('Trying to activate tab:', tabName, 'in component:', componentId);

    // Use shadcn-svelte tabs selector - look for TabsTrigger with matching value
    const selectors = [
        `[data-component-id="${componentId}"] [role="tab"][data-value="${tabName}"]`,
        `[data-component-id="${componentId}"] [role="tab"]`, // Fallback to check all tabs in component
        `[role="tab"][data-value="${tabName}"]`, // Global fallback with exact value match
        `[role="tab"]`, // Last resort fallback
    ];

    for (const selector of selectors) {
        const tabTriggers = document.querySelectorAll(selector);
        console.log(`Found ${tabTriggers.length} tab triggers with selector: ${selector}`);

        for (const trigger of tabTriggers) {
            // For shadcn tabs, check data-value attribute first (most reliable)
            const dataValue = trigger.getAttribute('data-value');
            const valueAttr = trigger.getAttribute('value');
            const titleAttr = trigger.getAttribute('title');
            const triggerText = trigger.textContent?.trim();

            console.log('Checking tab trigger:', {
                dataValue,
                valueAttr,
                titleAttr,
                triggerText,
                targetTabName: tabName
            });

            // Match by data-value (primary), value attribute, title, or text content
            if (dataValue === tabName ||
                valueAttr === tabName ||
                titleAttr === tabName ||
                triggerText === tabName) {
                console.log('Found matching tab, clicking:', trigger);
                (trigger as HTMLElement).click();
                // Add a small delay to ensure the tab switch completes
                setTimeout(() => {
                    console.log('Tab activation completed');
                }, 50);
                return;
            }
        }
    }

    console.warn('Could not find tab with name:', tabName);
}

/**
 * Main navigation function that handles all the smart navigation logic
 */
export async function navigateToError(error: ValidationError): Promise<void> {
    const target = getNavigationTarget(error);

    console.log('Navigating to error:', error);
    console.log('Navigation target:', target);

    try {
        // Step 1: Expand component if needed
        console.log('Step 1: Expanding component if needed');
        expandComponentIfNeeded(target.componentId);

        // Step 2: Wait for component expansion
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 3: Activate tab if needed
        if (target.tabName) {
            console.log('Step 3: Activating tab:', target.tabName);
            activateTabIfNeeded(target.tabName, target.componentId);

            // Wait for tab activation
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        // Step 4: Scroll to and focus the field
        console.log('Step 4: Scrolling to field:', target.elementId);
        await scrollToField(target.elementId);

        console.log(`Successfully navigated to error: ${error.label} in ${error.componentLabel || 'Unknown Component'}`);
    } catch (err) {
        console.error('Failed to navigate to error:', err);

        // Fallback: try to find and focus the field directly
        console.log('Trying fallback navigation...');
        const element = document.getElementById(target.elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = element.querySelector('input, textarea, select') as HTMLElement;
            if (input) input.focus();
        }
    }
}

/**
 * Utility to set up automatic component expansion listeners
 */
export function setupNavigationListeners(): void {
    // Listen for component expansion requests
    document.addEventListener('expandComponent', (event: Event) => {
        const customEvent = event as CustomEvent;
        const { componentId } = customEvent.detail;

        console.log('Attempting to expand component:', componentId);

        // Find the component element
        const componentElement = document.querySelector(`[data-component-id="${componentId}"]`);
        if (componentElement) {
            console.log('Found component element:', componentElement);

            const isCollapsed = componentElement.getAttribute('data-collapsed') === 'true';
            console.log('Component collapsed state:', isCollapsed);

            if (isCollapsed) {
                // If collapsed, click the component itself to expand it
                console.log('Component is collapsed, clicking to expand');
                (componentElement as HTMLElement).click();
            } else {
                console.log('Component is already expanded');
            }
        } else {
            console.warn('Component element not found for ID:', componentId);
        }
    });
}

/**
 * Adds data attributes to form elements for easier navigation
 */
export function enhanceFormWithNavigationAttributes(componentId: string): void {
    const componentElement = document.querySelector(`[data-component-id="${componentId}"]`);
    if (!componentElement) return;

    // Add component ID to tabs
    const tabContainers = componentElement.querySelectorAll('[role="tablist"]');
    tabContainers.forEach(container => {
        container.setAttribute('data-component-id', componentId);
    });

    // Add IDs to form fields if they don't have them
    const formFields = componentElement.querySelectorAll('input, textarea, select');
    formFields.forEach((field, index) => {
        if (!field.id) {
            const fieldName = field.getAttribute('name') || `field-${index}`;
            field.id = generateFieldId(componentId, fieldName);
        }
    });
}
