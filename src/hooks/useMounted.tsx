"use client";
import { useEffect, useState } from "react";

const useMounted = () => {
  const [mounted, setMounted] = useState(false);

  // *Set initial state to prevent hydration mismatch issues
  // *Ensure the component only renders on the client side to avoid discrepancies between server and client
  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
};
export default useMounted;
