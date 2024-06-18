import {BobError} from "./errors/BobError";

export class ExceptionHandler {
    handle(err: Error | BobError) {

        if (err instanceof BobError) {
            err.pretty()

            return -1;
        }
        throw err;
    }
}