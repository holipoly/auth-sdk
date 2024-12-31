import type { PropsWithChildren } from "react";
import { Provider } from "./context";
import { HolipolyAuthClient } from "../HolipolyAuthClient";

export const HolipolyAuthProvider = ({ children, client }: PropsWithChildren<{ client: HolipolyAuthClient }>) => {
  return <Provider value={client}>{children}</Provider>;
};
