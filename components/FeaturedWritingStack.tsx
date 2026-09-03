"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import styles from "./HomeLanding.module.css";

export type FeaturedWriting = {
  title: string;
  href: string;
};

const SWIPE_THRESHOLD = 48;

export function FeaturedWritingStack({ entries }: { entries: FeaturedWriting[] }) {
  const [current, setCurrent] = useState(0);
  const [instant, setInstant] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const instantFrame = useRef<number | null>(null);
  const count = entries.length;

  useEffect(
    () => () => {
      if (instantFrame.current !== null) {
        window.cancelAnimationFrame(instantFrame.current);
      }
    },
    [],
  );

  if (count === 0) return null;

  const select = (next: number, shouldAnimate = true) => {
    if (!shouldAnimate) {
      if (instantFrame.current !== null) {
        window.cancelAnimationFrame(instantFrame.current);
      }
      setInstant(true);
      instantFrame.current = window.requestAnimationFrame(() => {
        setInstant(false);
        instantFrame.current = null;
      });
    }

    setCurrent((next + count) % count);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;

    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    select(current + (distance < 0 ? 1 : -1));
  };

  return (
    <section
      className={styles.featuredStack}
      data-instant={instant || undefined}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured writing"
    >
      <div
        className={styles.featuredCards}
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
        }}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
      >
        {entries.map((entry, index) => {
          const depth = (index - current + count) % count;
          const isActive = depth === 0;

          return (
            <article
              key={`${entry.href}-${index}`}
              className={styles.featuredCard}
              data-depth={Math.min(depth, 2)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={!isActive}
            >
              <div className={styles.featuredCardHeader}>
                <span>Selected writing</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2>{entry.title}</h2>
              <Link href={entry.href} tabIndex={isActive ? 0 : -1}>
                Open this piece →
              </Link>
            </article>
          );
        })}
      </div>

      <div className={styles.featuredControls}>
        <button
          type="button"
          className={styles.featuredControl}
          onClick={(event) => select(current - 1, event.detail !== 0)}
          aria-label="Previous featured writing"
        >
          <ArrowLeftIcon aria-hidden="true" />
        </button>
        <span aria-live="polite">
          {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
        <button
          type="button"
          className={styles.featuredControl}
          onClick={(event) => select(current + 1, event.detail !== 0)}
          aria-label="Next featured writing"
        >
          <ArrowRightIcon aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
