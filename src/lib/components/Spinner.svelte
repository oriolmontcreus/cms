<script>
    const bars = Array(12).fill(0);
</script>

<div class="h-[24px] w-[24px]">
    <div class="relative left-1/2 top-1/2 h-[inherit] w-[inherit]">
        {#each bars as _, i}
            <div
                class="animate-spinner absolute -left-[10%] -top-[3.9%] h-[8%] w-[24%] rounded-md bg-neutral-400"
                aria-label={`spinner-bar-${i + 1}`}
                style={`animation-delay: -${1.3 - i * 0.1}s; transform: rotate(${30 * i}deg) translate(146%);`}
            ></div>
        {/each}
    </div>
</div>

<style>
    @keyframes spinner {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
    .animate-spinner {
        animation: spinner 1.2s linear infinite;
    }
</style>
