import React, { useEffect } from 'react';
import { base44 } from "@/api/base44Client";

export default function UserPresence() {
  useEffect(() => {
    // Function to update last_seen
    const heartbeat = async () => {
      try {
        if (await base44.auth.isAuthenticated()) {
          await base44.auth.updateMe({ last_seen: new Date().toISOString() });
        }
      } catch (error) {
        // Silently fail if update fails (e.g. network issue)
        console.error("Presence heartbeat failed", error);
      }
    };

    // Initial call
    heartbeat();

    // Set up interval (every 60 seconds)
    const intervalId = setInterval(heartbeat, 60000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, []);

  return null; // This component doesn't render anything visually
}