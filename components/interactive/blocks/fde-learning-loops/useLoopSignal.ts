"use client";

import { useEffect, useRef, useState } from "react";

// One reversible timeline: each lap finishes before handing off to its parent.
export const LOOP_STOPS = [0, 1400, 3120, 5040, 5460] as const;
const ENTER_TIMES = [0, 1720, 3440];
const LAP_ENDS = [1400, 3120, 5040];
const RADII = [[.22, .17], [.34, .31], [.46, .45]] as const;

export function loopGeometry(width: number, height: number) {
  return RADII.map(([x, y]) => ({ cx: width / 2, cy: height / 2, rx: width * x, ry: height * y }));
}

export function signalExit(width: number, height: number, stacked: boolean) {
  const x = width * .96;
  const y = height / 2;
  return stacked
    ? [{ x, y }, { x: width * .985, y }, { x: width * .985, y: height - 4 }, { x: width / 2, y: height - 4 }, { x: width / 2, y: height + 14 }]
    : [{ x, y }, { x: width + 22, y }];
}

type Scene = { active: number; complete: number; ready: boolean; moving: boolean };
const INITIAL: Scene = { active: -1, complete: -1, ready: false, moving: false };

export function useLoopSignal(phase: number, width: number, height: number, stacked: boolean) {
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
    geometry.forEach(({ cx, cy, rx, ry }, index) => {
      push(cx + rx, cy, ENTER_TIMES[index]);
      for (let sample = 1; sample <= 96; sample++) {
        const angle = sample / 96 * Math.PI * 2;
        push(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry,
          ENTER_TIMES[index] + sample / 96 * (LAP_ENDS[index] - ENTER_TIMES[index]));
      }
    });
    const exit = signalExit(width, height, stacked);
    const lengths = exit.slice(1).map((point, i) => Math.hypot(point.x - exit[i].x, point.y - exit[i].y));
    const total = lengths.reduce((sum, length) => sum + length, 0);
    let travelled = 0;
    exit.slice(1).forEach((point, i) => {
      travelled += lengths[i];
      push(point.x, point.y, LOOP_STOPS[3] + travelled / total * (LOOP_STOPS[4] - LOOP_STOPS[3]));
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
        ready: time >= LOOP_STOPS[4],
        moving: !arrived && !reduced.matches,
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
  }, [phase, width, height, stacked]);

  return { signalRef, scene };
}
