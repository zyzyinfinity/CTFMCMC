"use client";

import { useEffect } from "react";
import { addRecent } from "@/lib/recent";

export default function TrackVisit(props: {
  title: string;
  href: string;
  sectionLabel: string;
  categoryLabel: string;
}) {
  useEffect(() => {
    addRecent(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.href]);

  return null;
}
