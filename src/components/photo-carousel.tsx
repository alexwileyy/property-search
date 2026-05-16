"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Star,
} from "lucide-react";
import { Button, IconButton } from "@radix-ui/themes";
import type { PropertyImage } from "@/db/schema";
import { setFeatureImageAction } from "@/app/actions";

type Props = {
  images: PropertyImage[];
  propertyId?: string;
};

export function PhotoCarousel({ images, propertyId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  function onSetCover() {
    if (!propertyId) return;
    const current = images[selectedIndex];
    if (!current) return;
    startTransition(async () => {
      const result = await setFeatureImageAction(propertyId, current.url);
      if (result.ok) {
        emblaApi?.scrollTo(0);
        router.refresh();
      }
    });
  }

  const canSetCover =
    !!propertyId && images.length > 1 && selectedIndex > 0;

  if (images.length === 0) {
    return (
      <div
        style={{
          aspectRatio: "16 / 10",
          background: "var(--gray-3)",
          color: "var(--gray-9)",
          borderRadius: "var(--radius-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-2)",
        }}
      >
        <ImageOff size={20} />
        <span>No photos</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={emblaRef}
        style={{
          overflow: "hidden",
          borderRadius: "var(--radius-4)",
          background: "var(--gray-3)",
        }}
      >
        <div style={{ display: "flex" }}>
          {images.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              style={{ flex: "0 0 100%", minWidth: 0 }}
            >
              <img
                src={img.url}
                alt={img.caption ?? `Photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                style={{
                  display: "block",
                  width: "100%",
                  aspectRatio: "16 / 10",
                  objectFit: "cover",
                }}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 ? (
        <>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "var(--space-3)",
              transform: "translateY(-50%)",
            }}
          >
            <IconButton
              size="3"
              variant="solid"
              color="gray"
              highContrast
              radius="full"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              aria-label="Previous photo"
              style={{ opacity: canPrev ? 0.85 : 0.3 }}
            >
              <ChevronLeft size={20} />
            </IconButton>
          </div>
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "var(--space-3)",
              transform: "translateY(-50%)",
            }}
          >
            <IconButton
              size="3"
              variant="solid"
              color="gray"
              highContrast
              radius="full"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              aria-label="Next photo"
              style={{ opacity: canNext ? 0.85 : 0.3 }}
            >
              <ChevronRight size={20} />
            </IconButton>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "var(--space-3)",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 6,
              pointerEvents: "none",
            }}
          >
            {images.map((_, i) => (
              <span
                key={i}
                aria-hidden
                style={{
                  width: i === selectedIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background:
                    i === selectedIndex
                      ? "var(--color-background)"
                      : "rgba(255,255,255,0.5)",
                  transition: "width 150ms ease",
                }}
              />
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              top: "var(--space-3)",
              right: "var(--space-3)",
              background: "rgba(0,0,0,0.65)",
              color: "white",
              padding: "2px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {selectedIndex + 1} / {images.length}
          </div>
        </>
      ) : null}

      {canSetCover ? (
        <div
          style={{
            position: "absolute",
            bottom: "var(--space-3)",
            right: "var(--space-3)",
          }}
        >
          <Button
            size="2"
            variant="solid"
            color="gray"
            highContrast
            radius="full"
            onClick={onSetCover}
            disabled={pending}
          >
            <Star size={14} />
            {pending ? "Setting..." : "Set as cover"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
