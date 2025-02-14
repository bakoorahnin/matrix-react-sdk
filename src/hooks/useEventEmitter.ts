/*
Copyright 2019 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { useRef, useEffect, useState, useCallback } from "react";
import type { EventEmitter } from "events";

type Handler = (...args: any[]) => void;

// Hook to wrap event emitter on and removeListener in hook lifecycle
export const useEventEmitter = (emitter: EventEmitter, eventName: string | symbol, handler: Handler) => {
    // Create a ref that stores handler
    const savedHandler = useRef(handler);

    // Update ref.current value if handler changes.
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(
        () => {
            // allow disabling this hook by passing a falsy emitter
            if (!emitter) return;

            // Create event listener that calls handler function stored in ref
            const eventListener = (...args) => savedHandler.current(...args);

            // Add event listener
            emitter.on(eventName, eventListener);

            // Remove event listener on cleanup
            return () => {
                emitter.removeListener(eventName, eventListener);
            };
        },
        [eventName, emitter], // Re-run if eventName or emitter changes
    );
};

type Mapper<T> = (...args: any[]) => T;

export const useEventEmitterState = <T>(emitter: EventEmitter, eventName: string | symbol, fn: Mapper<T>): T => {
    const [value, setValue] = useState<T>(fn());
    const handler = useCallback((...args: any[]) => {
        setValue(fn(...args));
    }, [fn]);
    useEventEmitter(emitter, eventName, handler);
    return value;
};
