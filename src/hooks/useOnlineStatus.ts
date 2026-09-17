import { useState, useEffect } from "react";

/**
 * Hook to detect online/offline status with debouncing
 */
const useOnlineStatus = () => {
  // Start as "online" on both server and first client render to avoid
  // hydration mismatches; sync the real status after mount.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};

export default useOnlineStatus;
