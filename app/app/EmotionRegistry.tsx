"use client";

import * as React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";

// This implementation is from emotion-js
// https://github.com/emotion-js/emotion/issues/2928#issuecomment-1319747902
export default function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => {
    const cache = createCache({ key: "css" });
    cache.compat = true;
    return cache;
  });

  useServerInsertedHTML(() => {
    const entries = Object.entries(cache.inserted);
    if (entries.length === 0) {
      return null;
    }
    let styles = "";
    let dataEmotionAttribute = cache.key;

    const regularEntries: Array<[string, string | boolean]> = [];

    entries.forEach(([key, value]) => {
      if (typeof value === "string") {
        regularEntries.push([key, value]);
      }
    });

    regularEntries.forEach(([key, value]) => {
      dataEmotionAttribute += ` ${key}`;
      styles += value;
    });

    return (
      <style
        key={cache.key}
        data-emotion={dataEmotionAttribute}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
