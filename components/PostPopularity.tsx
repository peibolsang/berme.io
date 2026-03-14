"use client";

import { useEffect, useState } from "react";

type PostPopularityProps = {
  postUrl: string;
};

type PopularityState = {
  readCount: number;
  popularRank: number | null;
  isPopular: boolean;
};

const readCountFormatter = new Intl.NumberFormat("en-US");

const formatReadCount = (readCount: number) =>
  `${readCountFormatter.format(readCount)} reads`;

export const PostPopularity = ({ postUrl }: PostPopularityProps) => {
  const [popularity, setPopularity] = useState<PopularityState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    const trackRead = async () => {
      try {
        const response = await fetch("/api/post-reads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postUrl }),
          cache: "no-store",
          signal: controller.signal,
          keepalive: true,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as
          | ({ enabled: false } & Record<string, never>)
          | ({
              enabled: true;
              readCount: number;
              popularRank: number | null;
              isPopular: boolean;
            } & Record<string, unknown>);

        if (!isCurrent || !data.enabled) {
          return;
        }

        setPopularity({
          readCount: data.readCount,
          popularRank: data.popularRank,
          isPopular: data.isPopular,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.name !== "AbortError" &&
          process.env.NODE_ENV !== "production"
        ) {
          console.error("Unable to update post popularity", error);
        }
      }
    };

    void trackRead();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [postUrl]);

  if (!popularity) {
    return null;
  }

  return (
    <>
      <span aria-hidden="true">•</span>
      <span>{formatReadCount(popularity.readCount)}</span>
      {popularity.isPopular && popularity.popularRank ? (
        <>
          <span aria-hidden="true">•</span>
          <span>Popular #{popularity.popularRank}</span>
        </>
      ) : null}
    </>
  );
};
