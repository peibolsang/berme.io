"use client";

import { useEffect, useRef, useState } from "react";

type ContainerSize = {
  height: number;
  width: number;
};

const EMPTY_SIZE: ContainerSize = { height: 0, width: 0 };

export const useContainerSize = <ElementType extends HTMLElement>() => {
  const containerRef = useRef<ElementType>(null);
  const [size, setSize] = useState<ContainerSize>(EMPTY_SIZE);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateSize = ({ height, width }: DOMRectReadOnly) => {
      setSize((current) =>
        current.height === height && current.width === width
          ? current
          : { height, width },
      );
    };

    updateSize(container.getBoundingClientRect());

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        updateSize(entry.contentRect);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return { containerRef, size };
};
