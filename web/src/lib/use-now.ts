"use client";

import { useEffect, useState } from "react";

/** Current unix time in seconds. It is 0 until the page has loaded in the browser. */
export function useNowSeconds() {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  return now;
}
