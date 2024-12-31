import { useEffect } from "react";
import { type HolipolyAuthEvent, getStorageAuthEventKey } from "../HolipolyRefreshTokenStorageHandler";

interface UseAuthChangeProps {
  holipolyApiUrl: string;
  onSignedIn?: () => void;
  onSignedOut?: () => void;
}

// used to handle client cache invalidation on login / logout and when
// token refreshin fails
export const useAuthChange = ({ holipolyApiUrl, onSignedOut, onSignedIn }: UseAuthChangeProps) => {
  const handleAuthChange = (event: HolipolyAuthEvent) => {
    const isCustomAuthEvent = event?.type === getStorageAuthEventKey(holipolyApiUrl);

    if (!isCustomAuthEvent) {
      return;
    }

    const { authState } = event.detail;

    if (authState === "signedIn") {
      onSignedIn?.();
    } else if (authState === "signedOut") {
      onSignedOut?.();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // for current window
    window.addEventListener(getStorageAuthEventKey(holipolyApiUrl), handleAuthChange as EventListener);

    return () => {
      window.removeEventListener(getStorageAuthEventKey(holipolyApiUrl), handleAuthChange as EventListener);
    };
  }, []);
};
