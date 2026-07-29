"use client";

import { useEffect, useState } from "react";

type DoorSlot = {
  left?: string;
  right?: string;
  top: string;
  width: number;
  opacity: number;
  rotate: number;
};

const LEFT_SLOTS: DoorSlot[] = [
  { left: "2%", top: "6%", width: 68, opacity: 0.4, rotate: -4 },
  { left: "4%", top: "78%", width: 60, opacity: 0.38, rotate: 4 },
  { left: "20%", top: "40%", width: 46, opacity: 0.32, rotate: -3 },
  { left: "13%", top: "58%", width: 42, opacity: 0.32, rotate: 3 },
  { left: "30%", top: "4%", width: 32, opacity: 0.28, rotate: -2 },
  { left: "33%", top: "66%", width: 30, opacity: 0.28, rotate: 5 },
  { left: "9%", top: "24%", width: 34, opacity: 0.28, rotate: -5 },
  { left: "22%", top: "84%", width: 26, opacity: 0.26, rotate: 3 },
  { left: "6%", top: "44%", width: 24, opacity: 0.26, rotate: -3 },
  { left: "16%", top: "14%", width: 28, opacity: 0.28, rotate: 2 },
];

const RIGHT_SLOTS: DoorSlot[] = [
  { right: "2%", top: "8%", width: 72, opacity: 0.4, rotate: 4 },
  { right: "3%", top: "80%", width: 62, opacity: 0.38, rotate: -4 },
  { right: "21%", top: "42%", width: 46, opacity: 0.32, rotate: 3 },
  { right: "14%", top: "60%", width: 40, opacity: 0.32, rotate: -3 },
  { right: "31%", top: "6%", width: 32, opacity: 0.28, rotate: 2 },
  { right: "34%", top: "64%", width: 30, opacity: 0.28, rotate: -5 },
  { right: "10%", top: "26%", width: 34, opacity: 0.28, rotate: 4 },
  { right: "23%", top: "86%", width: 26, opacity: 0.26, rotate: -3 },
  { right: "7%", top: "46%", width: 24, opacity: 0.26, rotate: 3 },
  { right: "17%", top: "16%", width: 28, opacity: 0.28, rotate: -2 },
];

/** A single fine-line door sketch, positioned via inline style. */
function DoorSketch({ slot, visible }: { slot: DoorSlot; visible: boolean }) {
  const { left, right, top, width, opacity, rotate } = slot;
  const height = width * 1.7;
  return (
    <svg
      viewBox="0 0 40 68"
      width={width}
      height={height}
      className="absolute transition-opacity duration-700 ease-in-out"
      style={{
        left,
        right,
        top,
        opacity: visible ? opacity : 0,
        transform: `rotate(${rotate}deg)`,
      }}
      aria-hidden
    >
      <path
        d="M2,68 L2,22 A18,18 0 0 1 38,22 L38,68"
        fill="none"
        stroke="#002FA7"
        strokeWidth="1.85"
      />
      <line x1="2" y1="68" x2="38" y2="68" stroke="#002FA7" strokeWidth="1.85" />
      <circle cx="31" cy="46" r="1.6" fill="#002FA7" />
    </svg>
  );
}

/** Cycles one door sketch through its side's slot pool, fading out and back in at a new spot. */
function AnimatedDoor({ slots, startIndex, delay }: { slots: DoorSlot[]; startIndex: number; delay: number }) {
  const [slotIndex, setSlotIndex] = useState(startIndex);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleFadeOut(waitMs: number) {
      timeoutId = setTimeout(() => {
        setVisible(false);
        timeoutId = setTimeout(() => {
          setSlotIndex((current) => {
            let next = current;
            while (next === current) {
              next = Math.floor(Math.random() * slots.length);
            }
            return next;
          });
          setVisible(true);
          scheduleFadeOut(3200 + Math.random() * 3200);
        }, 700);
      }, waitMs);
    }

    scheduleFadeOut(delay);
    return () => clearTimeout(timeoutId);
  }, [slots.length, delay]);

  return <DoorSketch slot={slots[slotIndex]} visible={visible} />;
}

/** Fine-line door sketches scattered in the left/right margins, fading between random positions. */
export default function DoorSketchBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <AnimatedDoor key={`left-${i}`} slots={LEFT_SLOTS} startIndex={i} delay={1500 + i * 900} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <AnimatedDoor key={`right-${i}`} slots={RIGHT_SLOTS} startIndex={i} delay={1900 + i * 900} />
      ))}
    </div>
  );
}
