import type { ReactNode } from "react";

/**
 * The one box every timer screen lives in: exactly the size of the visible
 * screen (fixed to the viewport edges), with the safe areas (camera cut-outs,
 * gesture bars) as padding inside it.
 *
 * Rule: nothing inside may scroll or be cut off, on any device, in portrait or
 * landscape. Children size themselves with `h-full` and container query units,
 * never with viewport units, which ignore the safe-area padding.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-phone-bg pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] text-phone-fg">
      <div className="[container-type:size] relative h-full w-full">
        {children}
      </div>
    </div>
  );
}
