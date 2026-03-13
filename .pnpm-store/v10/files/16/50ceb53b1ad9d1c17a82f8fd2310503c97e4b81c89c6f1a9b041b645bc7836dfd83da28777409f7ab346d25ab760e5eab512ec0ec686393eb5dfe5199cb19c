import { MutableRefObject } from 'react';
import { Bounds } from '@rive-app/canvas';
import { UseRiveOptions } from '../types';
interface UseResizeCanvasProps {
    /**
     * Whether or not Rive is loaded and renderer is associated with the canvas
     */
    riveLoaded: boolean;
    /**
     * Ref to the canvas element
     */
    canvasElem: HTMLCanvasElement | null;
    /**
     * Ref to the container element of the canvas
     */
    containerRef: MutableRefObject<HTMLElement | null>;
    /**
     * (Optional) Callback to be invoked after the canvas has been resized due to a resize
     * of its parent container. This is where you would want to reset the layout
     * dimensions for the Rive renderer to dictate the new min/max bounds of the
     * canvas.
     *
     * Using the high-level JS runtime, this might be a simple call to `rive.resizeToCanvas()`
     * Using the low-level JSruntime, this might be invoking the renderer's `.align()` method
     * with the Layout and min/max X/Y values of the canvas.
     *
     * @returns void
     */
    onCanvasHasResized?: () => void;
    /**
     * (Optional) Options passed to the useRive hook, including the shouldResizeCanvasToContainer option
     * which prevents the canvas element from resizing to its parent container
     */
    options?: Partial<UseRiveOptions>;
    /**
     * (Optional) AABB bounds of the artboard. If provided, the canvas will be sized to the artboard
     * height if the fitCanvasToArtboardHeight option is true.
     */
    artboardBounds?: Bounds;
}
/**
 * Helper hook to listen for changes in the <canvas> parent container size and size the <canvas>
 * to match. If a resize event has occurred, a supplied callback (onCanvasHasResized)
 * will be inokved to allow for any re-calculation needed (i.e. Rive layout on the canvas).
 *
 * This hook is useful if you are not intending to use the `useRive` hook yourself, but still
 * want to use the auto-sizing logic on the canvas/container.
 *
 * @param props - Object to supply necessary props to the hook
 */
export default function useResizeCanvas({ riveLoaded, canvasElem, containerRef, options, onCanvasHasResized, artboardBounds, }: UseResizeCanvasProps): void;
export {};
