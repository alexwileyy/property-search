"use client";

import dynamic from "next/dynamic";
import { Box } from "@radix-ui/themes";

const PropertyMap = dynamic(() => import("./property-map"), {
  ssr: false,
  loading: () => (
    <Box
      style={{
        height: 280,
        borderRadius: "var(--radius-4)",
        background: "var(--gray-3)",
      }}
    />
  ),
});

export default PropertyMap;
