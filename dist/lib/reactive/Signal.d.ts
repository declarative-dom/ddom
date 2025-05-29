export declare class Signal<T> {
    #private;
    constructor(initialValue: T);
    get value(): T;
    set value(newValue: T);
    subscribe(fn: (value: T) => void): () => boolean;
}
