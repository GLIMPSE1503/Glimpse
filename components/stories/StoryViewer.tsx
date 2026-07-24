"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StoryGroup } from "@/lib/supabase/types";

type Props = {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
};

const STORY_DURATION_MS = 5000;

export default function StoryViewer({ groups, initialGroupIndex, onClose }: Props) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number>(0);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  function goToNextStory() {
    if (!currentGroup) return;

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }

  function goToPreviousStory() {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((i) => i - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  }

  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
    pausedAtRef.current = 0;
  }, [groupIndex, storyIndex]);

  useEffect(() => {
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pausedAtRef.current = Date.now() - startTimeRef.current;
      return;
    }

    startTimeRef.current = Date.now() - pausedAtRef.current;

    function tick() {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);

      if (pct >= 100) {
        goToNextStory();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, groupIndex, storyIndex]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goToNextStory();
      if (event.key === "ArrowLeft") goToPreviousStory();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex, groups.length]);

  if (!currentGroup || !currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative aspect-[9/16] h-[85vh] max-h-[720px] w-full max-w-sm overflow-hidden rounded-[28px] bg-slate-900 shadow-2xl"
        >
          <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-3">
            {currentGroup.stories.map((story, index) => (
              <div key={story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full bg-white transition-none"
                  style={{
                    width:
                      index < storyIndex ? "100%" : index === storyIndex ? `${progress}%` : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute inset-x-0 top-6 z-20 flex items-center gap-2 px-4">
            <div className="h-8 w-8 overflow-hidden rounded-full border border-white/30 bg-slate-700">
              {currentGroup.authorAvatar ? (
                <img
                  src={currentGroup.authorAvatar}
                  alt={currentGroup.authorName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
                  {currentGroup.authorName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-white">{currentGroup.authorName}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close story"
            className="absolute right-4 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white"
          >
            ✕
          </button>

          {/* Tap zones */}
          <button
            type="button"
            aria-label="Previous story"
            className="absolute left-0 top-0 z-10 h-full w-1/3"
            onClick={goToPreviousStory}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          />
          <button
            type="button"
            aria-label="Pause"
            className="absolute left-1/3 top-0 z-10 h-full w-1/3"
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          />
          <button
            type="button"
            aria-label="Next story"
            className="absolute right-0 top-0 z-10 h-full w-1/3"
            onClick={goToNextStory}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          />

          <AnimatePresence mode="wait">
            <motion.img
              key={currentStory.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={currentStory.image_url}
              alt="Story"
              className="h-full w-full object-cover"
            />
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}