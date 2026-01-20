// import { useCallback, useEffect, useRef, useState } from "react";
// import P3dEmbedApi from "@p3d/embed-api";
// import { LoaderCircle } from "lucide-react";
// import { AnimatePresence, motion } from "framer-motion";

// type ModelEmbedProps = {
//   p3dID: string;
//   voiceoverURL: string;
//   onClose: () => void;
// };
// const LoaderVariants = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1, transition: { duration: 0.3 } },
// };
// export default function ModelEmbed({
//   p3dID,
//   voiceoverURL,
//   onClose,
// }: ModelEmbedProps) {
//   const iframeRef = useRef<HTMLIFrameElement | null>(null);
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const p3dRef = useRef<P3dEmbedApi | null>(null);
//   //   const showController = useSimStore((s) => s.showController);
//   //   const setShowController = useSimStore((s) => s.setShowController);
//   // store the global handler so we can remove it from other places (e.g. unlockAudio)
//   const globalPointerHandlerRef = useRef<((e: PointerEvent) => void) | null>(
//     null
//   );
//   //   const [audioUnlocked, setAudioUnlocked] = useState(false);
//   const [modelLoaded, setModelLoaded] = useState(false);
//   // stable unlock function
//   const unlockAudio = useCallback(async () => {
//     if (!audioRef.current) {
//       //   setAudioUnlocked(true);
//       // still remove global handler so overlay disappears
//       if (globalPointerHandlerRef.current) {
//         window.removeEventListener(
//           "pointerdown",
//           globalPointerHandlerRef.current
//         );
//         globalPointerHandlerRef.current = null;
//       }
//       return;
//     }
//     try {
//       await audioRef.current.play();
//       audioRef.current.muted = false;
//       // Once audio finishes playing - toggle the onClose
//       audioRef.current.onended = () => {
//         onClose();
//       };
//     } catch (err) {
//       // If play() fails for any reason, we still remove the overlay because the user did gesture.
//       // (In practice a trusted pointer event on window should allow audio.play()).
//       console.warn("audio.play() failed on unlock gesture:", err);
//     } finally {
//       //   setAudioUnlocked(true);
//       if (globalPointerHandlerRef.current) {
//         window.removeEventListener(
//           "pointerdown",
//           globalPointerHandlerRef.current
//         );
//         globalPointerHandlerRef.current = null;
//       }
//     }
//   }, [onClose]);
//   const initP3dModel = useCallback(() => {
//     console.log("initializing p3d model");
//     p3dRef.current = new P3dEmbedApi(iframeRef.current!, {
//       onload() {
//         setModelLoaded(true);
//         console.log("p3d model loaded");
//         setTimeout(() => {
//           unlockAudio();
//         }, 500); // slight delay to ensure model is visible
//       },
//     });
//   }, [unlockAudio]);
//   // Initialize p3d embed API
//   useEffect(() => {
//     if (!iframeRef.current) return;
//     initP3dModel();
//     return () => {
//       if (!p3dRef.current) return;
//       p3dRef.current.destroy();
//       p3dRef.current = null;
//     };
//   }, [initP3dModel]);
//   // Add a window-level pointerdown listener that will unlock audio unless the
//   // pointerdown target is the iframe element itself.
//   //   useEffect(() => {
//   //     if (audioUnlocked) return; // no listener needed once unlocked
//   //     const handler = (e: PointerEvent) => {
//   //       try {
//   //         // If the pointerdown target is the iframe element itself, ignore it.
//   //         // (Clicks *inside* the iframe generally won't reach this handler anyway.)
//   //         if (iframeRef.current && e.target === iframeRef.current) {
//   //           return;
//   //         }
//   //         // Otherwise treat this as a valid parent document gesture and unlock audio.
//   //         unlockAudio();
//   //       } catch (err) {
//   //         if (err instanceof Error) {
//   //           console.warn(err.message);
//   //         }
//   //       }
//   //     };
//   //     globalPointerHandlerRef.current = handler;
//   //     window.addEventListener("pointerdown", handler);
//   //     return () => {
//   //       if (globalPointerHandlerRef.current) {
//   //         window.removeEventListener(
//   //           "pointerdown",
//   //           globalPointerHandlerRef.current
//   //         );
//   //         globalPointerHandlerRef.current = null;
//   //       }
//   //     };
//   //   }, [audioUnlocked, unlockAudio]);
//   //   useEffect(() => {
//   //     if (showController) {
//   //       setTimeout(() => {
//   //         if (iframeRef.current) {
//   //           iframeRef.current.style.opacity = "0";
//   //         }
//   //       }, 800);
//   //     } else {
//   //       if (iframeRef.current) {
//   //         iframeRef.current.style.opacity = "1";
//   //       }
//   //     }
//   //   }, [showController]);
//   return (
//     <div className="relative mx-auto w-full h-full flex flex-col items-center justify-center p-3">
//       <AnimatePresence>
//         {modelLoaded === false && (
//           <motion.div
//             className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-white"
//             variants={LoaderVariants}
//             initial="hidden"
//             animate="visible"
//             exit="hidden"
//           >
//             <LoaderCircle className="w-12 h-12 mb-4 animate-spin text-muted-foreground" />
//           </motion.div>
//         )}
//       </AnimatePresence>
//       <button
//         className="absolute top-3 right-3 text-xl font-semibold"
//         //variant="ghost"
//         onClick={onClose}
//       >
//         Skip
//       </button>
//       <div className="relative mx-auto w-full max-w-325 h-auto aspect-square">
//         {/* 3D Model */}
//         <iframe
//           ref={iframeRef}
//           title="3D Model"
//           width="100%"
//           height="100%"
//           allow="autoplay"
//           className="transition-opacity duration-300"
//           src={`https://p3d.in/e/${p3dID}+api+link+load+nopan+spin+bg-none+share,border,shading,hotspots,help,controls,loader,variants-hidden`}
//         />
//       </div>
//       {/* Voiceover */}
//       {voiceoverURL && (
//         <audio ref={audioRef} src={voiceoverURL} preload="auto" />
//       )}
//     </div>
//   );
// }


import { useCallback, useEffect, useRef, useState } from "react";
import P3dEmbedApi from "@p3d/embed-api";
import { useSimStore } from "../stores/useSimStore";

type ModelEmbedProps = {
  p3dID: string;
};

export default function ModelEmbed({ p3dID }: ModelEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const p3dRef = useRef<P3dEmbedApi | null>(null);

  const showController = useSimStore((s) => s.showController);
  const setShowController = useSimStore((s) => s.setShowController);
  

  // store the global handler so we can remove it from other places (e.g. unlockAudio)
  const globalPointerHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);

  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // stable unlock function
  const unlockAudio = useCallback(async () => {
    if (!audioRef.current) {
      setAudioUnlocked(true);
      // still remove global handler so overlay disappears
      if (globalPointerHandlerRef.current) {
        window.removeEventListener("pointerdown", globalPointerHandlerRef.current);
        globalPointerHandlerRef.current = null;
      }
      return;
    }

    try {
      await audioRef.current.play();
      audioRef.current.muted = false;
    } catch (err) {
      // If play() fails for any reason, we still remove the overlay because the user did gesture.
      // (In practice a trusted pointer event on window should allow audio.play()).
      console.warn("audio.play() failed on unlock gesture:", err);
    } finally {
      setAudioUnlocked(true);
      if (globalPointerHandlerRef.current) {
        window.removeEventListener("pointerdown", globalPointerHandlerRef.current);
        globalPointerHandlerRef.current = null;
      }
    }
  }, []);

  // Initialize p3d embed API
  useEffect(() => {
    if (!iframeRef.current) return;

    p3dRef.current = new P3dEmbedApi(iframeRef.current, {
      onload() {
        console.log("p3d model loaded");
      },
    });

    return () => {
      p3dRef.current?.destroy?.();
      p3dRef.current = null;
    };
  }, [p3dID]);

  // Add a window-level pointerdown listener that will unlock audio unless the
  // pointerdown target is the iframe element itself.
  useEffect(() => {
    if (audioUnlocked) return; // no listener needed once unlocked

    const handler = (e: PointerEvent) => {
      try {
        // If the pointerdown target is the iframe element itself, ignore it.
        // (Clicks *inside* the iframe generally won't reach this handler anyway.)
        if (iframeRef.current && e.target === iframeRef.current) {
          return;
        }

        // Otherwise treat this as a valid parent document gesture and unlock audio.
        unlockAudio();
      } catch (err) {
        if (err instanceof Error) {
          console.warn(err.message);
        }
      }
    };

    globalPointerHandlerRef.current = handler;
    window.addEventListener("pointerdown", handler);

    return () => {
      if (globalPointerHandlerRef.current) {
        window.removeEventListener("pointerdown", globalPointerHandlerRef.current);
        globalPointerHandlerRef.current = null;
      }
    };
  }, [audioUnlocked, unlockAudio]);

  useEffect(() => {
    if(showController){
        setTimeout(() => {
            if(iframeRef.current){
                iframeRef.current.style.opacity = '0';
            }
        }, 500)
    } else {
        if(iframeRef.current){
            iframeRef.current.style.opacity = '1'
        }
    }
  }, [showController]);

  return (
    <div className="relative mx-auto w-full max-w-245 aspect-square h-auto p-3">
      {/* Interaction overlay (removed after unlock) */}
      {!audioUnlocked && (
        <button
          onPointerDown={() => {
            // // enable spin only when interacted
            // const p3d = p3dRef.current;
            // if(p3d){
            //     p3d.setSpin(true);
            // }
            unlockAudio()
        }}
          
          className="absolute inset-0 z-5 flex items-center justify-center bg-white/10 text-black/30 text-lg font-medium cursor-pointer transition-all duration-200"
          aria-label="Start experience"
        >
          
          <img
          className="w-20 animate-pulse translate-y-full"
            src="/icons/tap_w.png"/>
        </button>
      )}

      {/* 3D Model */}
      <iframe
        ref={iframeRef}
        title="3D Model"
        width="100%"
        height="100%"
        allow="autoplay"
        className="transition-opacity duration-300"
        src={`https://p3d.in/e/${p3dID}+api+link,share,spin,border,shading,hotspots,help,-hidden+load+nopan+spin+bgcolor#000000`}
      />

      {/* Voiceover */}
      <audio
        ref={audioRef}
        src="/audio/voiceovers/JHT_J-215_voiceover-intro.mp3"
        preload="auto"
        muted
      />

      <button className={`relative bottom-0 right-0 bg-gray-200 p-4 rounded-xl z-100 cursor-pointer hover:opacity-50 transition-all duration-300  ${showController? 'opacity-0' : 'opacity-[100]'}`} onClick={(() => {
        if(p3dRef.current){

            if(audioRef.current){
                audioRef.current.pause();
            }



            const p3d = p3dRef.current;
            p3d.setSpin(false);

            //setTimeout(() => { // stops the spinning BEFORE transitioning
                p3d.listHotspots().then((hotspots)=>{
                    hotspots.forEach((h) => {
                        //console.log(h)
                        if(h.title == "controller"){
                            h.select();
                            setTimeout(() => {
                                setShowController(true);
                            }, 500);
                        }
                    });
                });
            //}, 150)
            
        }
      })}>
        MOVE TO CONTROLLER
      </button>
      <button className={`relative bottom-0 right-0 bg-gray-200 p-4 rounded-xl z-100 cursor-pointer hover:opacity-50 transition-all duration-300  ${showController? 'opacity-0' : 'opacity-[100]'}`} onClick={(() => {
        if(p3dRef.current){
            setShowController(false);
            if(audioRef.current){
                audioRef.current.play();
            }

            const p3d = p3dRef.current;
            

            p3d.listHotspots().then((hotspots)=>{
                hotspots.forEach((h) => {
                    //console.log(h)
                    if(h.title == "home"){
                        
                        setTimeout(() => {
                            h.select();
                            p3d.setSpin(true);
                        }, 400);
                    }
                });
            });
        }
      })}>
        MOVE HOME
      </button>
    </div>
  );
}
