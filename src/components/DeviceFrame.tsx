import { PropsWithChildren } from "react";

export function DeviceFrame({ children }: PropsWithChildren) {
  return <div className="app-shell">{children}</div>;
}
