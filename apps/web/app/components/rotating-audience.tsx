"use client";

import { useEffect, useState } from "react";

const AUDIENCES = ["companies", "professionals", "students", "everyday users"];

export function RotatingAudience() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIndex((current) => (current + 1) % AUDIENCES.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, []);

  return <span className="rotatingAudience">{AUDIENCES[index]}</span>;
}
