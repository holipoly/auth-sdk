import { useState, useEffect } from "react";
import { HolipolyExternalAuth } from "../HolipolyExternalAuth";
import { ExternalProvider } from "../types";

export type HolipolyExternalAuthState =
  | { loading: true; authURL?: undefined; error?: undefined }
  | { loading: false; authURL: string; error?: undefined }
  | { loading: false; authURL?: undefined; error: unknown };

export const useHolipolyExternalAuth = ({
  holipolyURL,
  provider,
  redirectURL,
}: {
  holipolyURL: string;
  provider: ExternalProvider;
  redirectURL: string;
}) => {
  const [state, setState] = useState<HolipolyExternalAuthState>({
    authURL: undefined,
    error: undefined,
    loading: true,
  });

  useEffect(() => {
    const triggerExternalAuth = async () => {
      try {
        const auth = new HolipolyExternalAuth(holipolyURL, provider);
        const result = await auth.initiate({ redirectURL });

        setState({ authURL: result, loading: false });
      } catch (error) {
        if (error instanceof Error) {
          setState({ loading: false, error: error.message });
        } else {
          setState({ loading: false, error: "Unknown error" });
        }
      }
    };

    void triggerExternalAuth();
  }, [holipolyURL]);

  return state;
};
