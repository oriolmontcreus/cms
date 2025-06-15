import { toast } from 'svelte-sonner';

export type ToastMessages<T> = {
    loading: string,
    success: (data: T) => string,
    error: string,
}

export function successToast(msg: string, options: Record<string, unknown> = {}) {
    toast.success(msg, options);
}

export function infoToast(msg: string, options: Record<string, unknown> = {}) {
    toast.info(msg, options);
}

export function errorToast(msg: string, options: Record<string, unknown> = {}) {
    toast.error(msg, options);
}

export function loadingToast(msg: string, options: Record<string, unknown> = {}) {
    toast.loading(msg, options);
}

export function actionToast(msg: string, action: () => void, actionLabel: string) {
    toast(msg, {
        action: {
            label: actionLabel,
            onClick: action,
        },
    })
}

export function promiseToast<T = any>(
    promise: Promise<T>,
    messages: ToastMessages<T>
): Promise<T> {
    toast.promise(
        promise,
        messages
    );
    return promise;
}