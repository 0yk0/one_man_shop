import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, X } from "lucide-react";

export const VideoDemo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-play when in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Update progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  return (
    <section className="py-24 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-4 tracking-tight"
          >
            See it in action.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-xl max-w-xl mx-auto"
          >
            Start selling in under 30 seconds.
          </motion.p>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-2xl"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {/* Video */}
          <video
            ref={videoRef}
            src="/product-video.mp4"
            className="w-full aspect-video object-cover cursor-pointer"
            muted={isMuted}
            loop={false}
            playsInline
            preload="metadata"
            poster="/screenshots/screenshot-06.png"
            onClick={handlePlayPause}
            onEnded={handleVideoEnd}
          />

          {/* Big Play Button (shows when paused) */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center bg-black/30"
              >
                <button
                  onClick={handlePlayPause}
                  className="group relative"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity scale-150" />
                  
                  {/* Button */}
                  <div className="relative flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-2xl transition-transform group-hover:scale-105">
                    <Play size={36} className="text-black ml-1.5" fill="black" />
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls Bar */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-4"
              >
                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer group">
                  <div
                    className="h-full bg-blue-500 rounded-full relative transition-all"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Play/Pause */}
                    <button
                      onClick={handlePlayPause}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                    </button>

                    {/* Mute */}
                    <button
                      onClick={handleMuteToggle}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                    </button>

                    {/* Time */}
                    <span className="text-white/70 text-sm font-medium">
                      0:26
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Fullscreen */}
                    <button
                      onClick={handleFullscreen}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      <Maximize size={22} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Title */}
          <div className="absolute top-4 left-4">
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-semibold">One Man Shop</p>
              <p className="text-xs text-white/60">Product Demo • 0:26</p>
            </div>
          </div>
        </motion.div>

        {/* Caption */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-500 text-sm">
            No sign-up required • Works offline • Free forever
          </p>
        </motion.div>
      </div>
    </section>
  );
};
