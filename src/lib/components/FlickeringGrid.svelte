<script lang="ts">
    import { cn } from "$lib/utils";
    import { onMount, onDestroy } from "svelte";

    export let squareSize = 4;
    export let gridGap = 6;
    export let flickerChance = 0.3;
    export let color = "var(--primary)";
    export let width: number | undefined = undefined;
    export let height: number | undefined = undefined;
    export let className = "";
    export let maxOpacity = 0.3;

    let canvasRef: HTMLCanvasElement;
    let containerRef: HTMLDivElement;
    let isInView = false;
    let canvasSize = { width: 0, height: 0 };

    let animationFrameId: number;
    let resizeObserver: ResizeObserver;
    let intersectionObserver: IntersectionObserver;
    let gridParams: {
        cols: number;
        rows: number;
        squares: Float32Array;
        dpr: number;
    } | null = null;

    const memoizedColor = (() => {
        const toRGBA = (color: string) => {
            if (typeof window === "undefined") {
                return `rgba(0, 0, 0,`;
            }

            // If color is a CSS custom property, resolve it
            let resolvedColor = color;
            if (color.startsWith("var(")) {
                const tempDiv = document.createElement("div");
                tempDiv.style.color = color;
                document.body.appendChild(tempDiv);
                const computedColor = window.getComputedStyle(tempDiv).color;
                document.body.removeChild(tempDiv);
                resolvedColor = computedColor;
            }

            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const ctx = canvas.getContext("2d");
            if (!ctx) return "rgba(255, 0, 0,";
            ctx.fillStyle = resolvedColor;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
            return `rgba(${r}, ${g}, ${b},`;
        };
        return toRGBA(color);
    })();

    const setupCanvas = (
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
    ) => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const cols = Math.floor(width / (squareSize + gridGap));
        const rows = Math.floor(height / (squareSize + gridGap));

        const squares = new Float32Array(cols * rows);
        for (let i = 0; i < squares.length; i++) {
            squares[i] = Math.random() * maxOpacity;
        }

        return { cols, rows, squares, dpr };
    };

    const updateSquares = (squares: Float32Array, deltaTime: number) => {
        for (let i = 0; i < squares.length; i++) {
            if (Math.random() < flickerChance * deltaTime) {
                squares[i] = Math.random() * maxOpacity;
            }
        }
    };

    const drawGrid = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        cols: number,
        rows: number,
        squares: Float32Array,
        dpr: number,
    ) => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const opacity = squares[i * rows + j];
                ctx.fillStyle = `${memoizedColor}${opacity})`;
                ctx.fillRect(
                    i * (squareSize + gridGap) * dpr,
                    j * (squareSize + gridGap) * dpr,
                    squareSize * dpr,
                    squareSize * dpr,
                );
            }
        }
    };

    const updateCanvasSize = () => {
        if (!canvasRef || !containerRef) return;

        const newWidth = width || containerRef.clientWidth;
        const newHeight = height || containerRef.clientHeight;
        canvasSize = { width: newWidth, height: newHeight };
        gridParams = setupCanvas(canvasRef, newWidth, newHeight);
    };

    let lastTime = 0;
    const animate = (time: number) => {
        if (!isInView || !gridParams) return;

        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        updateSquares(gridParams.squares, deltaTime);

        const ctx = canvasRef.getContext("2d");
        if (ctx) {
            drawGrid(
                ctx,
                canvasRef.width,
                canvasRef.height,
                gridParams.cols,
                gridParams.rows,
                gridParams.squares,
                gridParams.dpr,
            );
        }
        animationFrameId = requestAnimationFrame(animate);
    };

    onMount(() => {
        if (!canvasRef || !containerRef) return;

        updateCanvasSize();

        resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
        resizeObserver.observe(containerRef);

        intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isInView = entry.isIntersecting;
                if (isInView) {
                    animationFrameId = requestAnimationFrame(animate);
                } else {
                    cancelAnimationFrame(animationFrameId);
                }
            },
            { threshold: 0 },
        );
        intersectionObserver.observe(canvasRef);

        if (isInView) {
            animationFrameId = requestAnimationFrame(animate);
        }
    });

    onDestroy(() => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
        if (intersectionObserver) {
            intersectionObserver.disconnect();
        }
    });
</script>

<div
    bind:this={containerRef}
    class={cn(`h-full w-full ${className}`)}
    {...$$restProps}
>
    <canvas
        bind:this={canvasRef}
        class="pointer-events-none"
        style="width: {canvasSize.width}px; height: {canvasSize.height}px;"
    ></canvas>
</div>
