import { ViewModelInstance, ViewModelInstanceValue } from '@rive-app/canvas';
/**
 * Base hook for all ViewModelInstance property interactions.
 *
 * This hook handles the common tasks needed when working with Rive properties:
 * 1. Safely accessing properties (even during hot-reload)
 * 2. Keeping React state in sync with property changes
 * 3. Providing type safety for all operations
 *
 * @param path - Property path in the ViewModelInstance
 * @param viewModelInstance - The source ViewModelInstance
 * @param options - Configuration for working with the property
 * @returns Object with the value and operations
 */
export declare function useViewModelInstanceProperty<P extends ViewModelInstanceValue, V, R, E = undefined>(path: string, viewModelInstance: ViewModelInstance | null | undefined, options: {
    /** Function to get the property from a ViewModelInstance */
    getProperty: (vm: ViewModelInstance, path: string) => P | null;
    /** Function to get the current value from the property */
    getValue: (prop: P) => V;
    /** Default value to use when property is unavailable */
    defaultValue: V | null;
    /**
     * Function to create the property-specific operations
     *
     * @param safePropertyAccess - Helper function for safely working with properties. Handles stale property references.
     * @returns Object with operations like setValue, trigger, etc.
     */
    buildPropertyOperations: (safePropertyAccess: (callback: (prop: P) => void) => void) => R;
    /** Optional callback for property events (mainly used by triggers) */
    onPropertyEvent?: () => void;
    /**
     * Optional function to extract additional property data (like enum values)
     * Returns undefined if not provided
     */
    getExtendedData?: (prop: P) => E;
}): R & {
    value: V | null;
} & (E extends undefined ? {} : {
    extendedData: E | null;
});
