export type PasswordRequirement = {
    regex: RegExp;
    text: string;
};

const DEFAULT_PATTERNS = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[0-9]/, text: 'At least one number' },
    { regex: /[a-z]/, text: 'At least one lowercase letter' },
    { regex: /[A-Z]/, text: 'At least one uppercase letter' }
] as const;

export class PasswordStrength {
    #password = $state('');
    #isVisible = $state(false);
    readonly id: string;
    #requirements: readonly PasswordRequirement[];

    constructor(options: {
        id: string;
        initialPassword?: string;
        requirements?: PasswordRequirement[];
    }) {
        this.id = options.id;
        this.#password = options.initialPassword ?? '';
        this.#requirements = options.requirements ?? DEFAULT_PATTERNS.map(pattern => ({
            regex: pattern.regex,
            text: pattern.text
        }));

        this.toggleVisibility = this.toggleVisibility.bind(this);
    }

    get requirements() {
        return this.#requirements;
    }

    get password() {
        return this.#password;
    }

    set password(value: string) {
        this.#password = value;
    }

    get isVisible() {
        return this.#isVisible;
    }

    toggleVisibility = () => {
        this.#isVisible = !this.#isVisible;
    };

    strength = $derived(
        this.requirements.map((req) => ({
            met: req.regex.test(this.#password),
            text: req.text
        }))
    );

    strengthScore = $derived(this.strength.filter((req) => req.met).length);

    get strengthColor() {
        if (this.strengthScore === 0) return 'bg-border';
        if (this.strengthScore <= 1) return 'bg-red-500';
        if (this.strengthScore <= 2) return 'bg-orange-500';
        if (this.strengthScore === 3) return 'bg-amber-500';
        return 'bg-emerald-500';
    }

    get strengthText() {
        if (this.strengthScore === 0) return 'Enter a password';
        if (this.strengthScore <= 2) return 'Weak password';
        if (this.strengthScore === 3) return 'Medium strength';
        return 'Strong password';
    }
}

export function usePasswordStrength(options: {
    id: string;
    initialPassword?: string;
    requirements?: PasswordRequirement[];
}) {
    return new PasswordStrength(options);
}
