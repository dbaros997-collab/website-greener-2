import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

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
  const [index, setIndex] = useState(0);
  const [resumeKey, setResumeKey] = useState(0);
  const [animating, setAnimating] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const count = images.length;

  const goTo = useCallback(
    (next: number, withAnim = true) => {
      if (count === 0) return;
      const wrapped = ((next % count) + count) % count;
      // Instantly jump when wrapping so we don't slide across every image.
      const wrapping =
        (index === count - 1 && wrapped === 0) ||
        (index === 0 && wrapped === count - 1);
      setAnimating(withAnim && !wrapping);
      setIndex(wrapped);
      setResumeKey((k) => k + 1);
      onIndexChange?.(wrapped);
      if (wrapping && withAnim) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setAnimating(true));
        });
      }
    },
    [count, index, onIndexChange],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Preload all slides so transitions never wait on decode.
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, [images]);

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const wrapped = (i + 1) % count;
        const wrapping = i === count - 1 && wrapped === 0;
        setAnimating(!wrapping);
        onIndexChange?.(wrapped);
        if (wrapping) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setAnimating(true));
          });
        }
        return wrapped;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, onIndexChange, resumeKey]);

  if (count === 0) return null;

  return (
    <div
      className={`image-slider image-slider--${layout}${className ? ` ${className}` : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image slideshow"
    >
      <div className="image-slider__viewport">
        <div
          ref={trackRef}
          className={`image-slider__track${animating ? " is-animating" : ""}`}
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {images.map((src, i) => {
            const fit = objectFitFor?.has(src) ? "contain" : "cover";
            return (
              <div
                key={src}
                className="image-slider__slide"
                style={{
                  backgroundImage: `url("${src}")`,
                  backgroundSize: fit,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
                aria-hidden={i !== index}
                aria-label={`${altPrefix} ${i + 1} of ${count}`}
              />
            );
          })}
        </div>
      </div>

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
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
