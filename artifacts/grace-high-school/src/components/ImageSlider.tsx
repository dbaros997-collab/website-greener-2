import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ImageSliderProps = {
  images: string[];
  /** Auto-advance interval in ms. Default 5000. */
  intervalMs?: number;
  className?: string;
  /** `hero` fills a positioned parent; `section` is a mid-page gallery block. */
  layout?: "hero" | "section";
  /** Called whenever the active slide index changes. */
  onIndexChange?: (index: number) => void;
  /** Optional per-image object-fit override (e.g. contain for tall photos). */
  objectFitFor?: ReadonlySet<string>;
  altPrefix?: string;
  /** Overlay content (scrims, etc.) rendered above slides but below controls. */
  children?: ReactNode;
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0.6,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0.6,
  }),
};

export default function ImageSlider({
  images,
  intervalMs = 5000,
  className,
  layout = "hero",
  onIndexChange,
  objectFitFor,
  altPrefix = "Slide",
  children,
}: ImageSliderProps) {
  const [[index, direction], setSlide] = useState([0, 0]);
  const [resumeKey, setResumeKey] = useState(0);
  const count = images.length;

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (count === 0) return;
      const wrapped = ((next % count) + count) % count;
      setSlide([wrapped, dir]);
      setResumeKey((k) => k + 1);
      onIndexChange?.(wrapped);
    },
    [count, onIndexChange],
  );

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setSlide(([i]) => {
        const wrapped = (i + 1) % count;
        onIndexChange?.(wrapped);
        return [wrapped, 1];
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, onIndexChange, resumeKey]);

  if (count === 0) return null;

  const src = images[index];
  const fit = objectFitFor?.has(src) ? "contain" : "cover";

  return (
    <div
      className={`image-slider image-slider--${layout}${className ? ` ${className}` : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image slideshow"
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={index}
          className="image-slider__slide"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            backgroundImage: `url("${src}")`,
            backgroundSize: fit,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          aria-label={`${altPrefix} ${index + 1} of ${count}`}
        />
      </AnimatePresence>

      {children && (
        <div className="image-slider__overlay">{children}</div>
      )}

      {count > 1 && (
        <>
          <button
            type="button"
            className="image-slider__arrow image-slider__arrow--prev"
            onClick={prev}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className="image-slider__arrow image-slider__arrow--next"
            onClick={next}
            aria-label="Next image"
          >
            ›
          </button>

          <div className="image-slider__dots" role="tablist" aria-label="Slide indicators">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                className={`image-slider__dot${i === index ? " is-active" : ""}`}
                onClick={() => goTo(i, i > index ? 1 : -1)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
