export abstract class BobError extends Error {
    abstract pretty(): void;
}