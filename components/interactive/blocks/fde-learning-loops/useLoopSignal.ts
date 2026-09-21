"use client";

import { useEffect, useRef, useState } from "react";

// One reversible timeline: each lap finishes before handing off to its parent.
export const LOOP_STOPS = [0, 1400, 3120, 5040, 5040] as const;
const ENTER_TIMES = [0, 1720, 3440];
const LAP_ENDS = [1400, 3120, 5040];
const SIZES = [.48, .72, .96] as const;

export function loopGeometry(width: number, height: number) {
  return SIZES.map(scale => {
    const side = Math.min(width, height) * scale;
    return { cx: width / 2, cy: height / 2, rx: side / 2, ry: side / 2, radius: Math.min(32, side * .14) };
  });
}

type Scene = { active: number; complete: number; ready: boolean; moving: boolean };
const INITIAL: Scene = { active: -1, complete: -1, ready: false, moving: false };

export function useLoopSignal(phase: number, width: number, height: number) {
  const signalRef = useRef<HTMLSpanElement>(null);
  const playhead = useRef(0);
  const keyboard = useRef(false);
  const [scene, setScene] = useState<Scene>(INITIAL);
  const sceneRef = useRef(INITIAL);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) keyboard.current = true;
    };
    const onPointer = () => { keyboard.current = false; };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onPointer, { passive: true });
    window.addEventListener("touchstart", onPointer, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onPointer);
      window.removeEventListener("touchstart", onPointer);
    };
  }, []);

  useEffect(() => {
    const node = signalRef.current;
    if (!node) return;
    const geometry = loopGeometry(width, height);
    const frames: Keyframe[] = [];
    const push = (x: number, y: number, time: number) => frames.push({
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
      offset: time / LOOP_STOPS[4],
    });
    geometry.forEach(({ cx, cy, rx, radius }, index) => {
      const track = node.parentElement?.querySelector<SVGRectElement>(`[data-signal-track="${index}"]`);
      if (!track) return;
      const length = track.getTotalLength();
      // SVG rectangles start on the top edge; begin each lap at the right midpoint.
      const startOffset = 3 * rx - 3 * radius + Math.PI * radius / 2;
      push(cx + rx, cy, ENTER_TIMES[index]);
      for (let sample = 1; sample <= 128; sample++) {
        const point = track.getPointAtLength((startOffset + sample / 128 * length) % length);
        push(point.x, point.y,
          ENTER_TIMES[index] + sample / 128 * (LAP_ENDS[index] - ENTER_TIMES[index]));
      }
    });

    const target = LOOP_STOPS[phase];
    const start = playhead.current;
    const direction = target >= start ? 1 : -1;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animation = node.animate(frames, { duration: LOOP_STOPS[4], easing: "linear", fill: "both" });
    animation.pause();
    animation.currentTime = start;
    // Quick scrolling catches up within 1.8s; normal steps retain their full lap.
    animation.playbackRate = direction * Math.max(1, Math.abs(target - start) / 1800);
    if (reduced.matches || keyboard.current) animation.currentTime = target;
    else if (target !== start) animation.play();

    let frame = 0;
    const tick = () => {
      let time = Number(animation.currentTime ?? target);
      const arrived = direction > 0 ? time >= target : time <= target;
      if (arrived) {
        time = target;
        animation.pause();
        animation.currentTime = target;
      }
      playhead.current = time;
      const next: Scene = {
        active: phase === 0 && arrived ? -1 : time < ENTER_TIMES[1] ? 0 : time < ENTER_TIMES[2] ? 1 : 2,
        complete: time >= LAP_ENDS[2] ? 2 : time >= LAP_ENDS[1] ? 1 : time >= LAP_ENDS[0] ? 0 : -1,
        ready: phase === 4 && time >= LOOP_STOPS[4],
        moving: !arrived && time < LOOP_STOPS[3] && !reduced.matches,
      };
      const prev = sceneRef.current;
      if (next.active !== prev.active || next.complete !== prev.complete || next.ready !== prev.ready || next.moving !== prev.moving) {
        sceneRef.current = next;
        setScene(next);
      }
      if (!arrived) frame = requestAnimationFrame(tick);
    };
    const onReduced = () => {
      if (reduced.matches) {
        animation.pause();
        animation.currentTime = target;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(tick);
      }
    };
    reduced.addEventListener("change", onReduced);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      reduced.removeEventListener("change", onReduced);
      playhead.current = Math.max(0, Math.min(LOOP_STOPS[4], Number(animation.currentTime ?? playhead.current)));
      animation.cancel();
    };
  }, [phase, width, height]);

  return { signalRef, scene };
}
