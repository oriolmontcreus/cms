import { promiseToast, type ToastMessages } from "@/services/toast.service";
import { logErr } from "./logErr";

export async function safeFetch<T>(
    promise: Promise<T>,
): Promise<[T | null, any]> {
    try {
        return [await promise, null];
    } catch (err) {
        // Only log non-auth related errors
        if (!(err instanceof Error && err.message?.includes("401"))) {
            logErr(err);
        }
        return [null, err];
    }
}

export async function fetchWithToast<T>(
    promise: Promise<T>,
    messages: ToastMessages<T>
): Promise<[T | null, any]> {
    const [data, error] = await safeFetch(promiseToast(promise, messages) as Promise<T>);
    return [data, error];
}
