"use client";

import { useEffect } from "react";

type PostReadTrackerProps = {
  postUrl: string;
};

export const PostReadTracker = ({ postUrl }: PostReadTrackerProps) => {
  useEffect(() => {
    const trackRead = async () => {
      try {
        await fetch("/api/post-reads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postUrl }),
          cache: "no-store",
          keepalive: true,
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Unable to track post read", error);
        }
      }
    };

    void trackRead();
  }, [postUrl]);

  return null;
};
