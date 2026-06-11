"use client";

import * as React from "react";

const emptySubscribe = () => () => {};

/**
 * Returns true only after the component has mounted on the client.
 *
 * Use this to gate behavior that depends on React event handlers being
 * attached — e.g. disabling a form's submit button until hydration completes
 * so a native browser GET fallback can never fire (which would otherwise
 * place credentials in the URL bar).
 *
 * Implemented with useSyncExternalStore so it deterministically returns
 * `false` during SSR and `true` on the client immediately after mount,
 * regardless of Suspense boundaries above.
 */
export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,  // client snapshot
    () => false  // server snapshot
  );
}
