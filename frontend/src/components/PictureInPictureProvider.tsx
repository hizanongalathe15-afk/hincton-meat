import { ReactNode, useEffect, useRef, useState } from 'react'
import { PictureInPicture2 } from 'lucide-react'

const PictureInPictureProvider = ({ children }: { children: ReactNode }) => {
  const [supported] = useState(() => typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled)
  const [hasVideo, setHasVideo] = useState(false)
  const [inPip, setInPip] = useState(false)
  const activeVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!supported) return

    const videos = new Set<HTMLVideoElement>()

    const refresh = () => setHasVideo(videos.size > 0)

    const isPlayable = (video: HTMLVideoElement) => Boolean(video.src || video.querySelector('source'))

    const register = (video: HTMLVideoElement) => {
      if (videos.has(video)) return
      videos.add(video)
      video.addEventListener('loadedmetadata', () => {
        if (!activeVideoRef.current) activeVideoRef.current = video
      })
      refresh()
    }

    const unregister = (video: HTMLVideoElement) => {
      if (!videos.delete(video)) return
      if (activeVideoRef.current === video) activeVideoRef.current = null
      refresh()
    }

    const scan = (root: ParentNode) => {
      root.querySelectorAll('video').forEach((video) => {
        if (isPlayable(video)) register(video)
      })
    }

    scan(document.body)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node instanceof HTMLVideoElement && isPlayable(node)) register(node)
          else scan(node)
        })
        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node instanceof HTMLVideoElement) unregister(node)
          else node.querySelectorAll('video').forEach(unregister)
        })
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const onPlay = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) activeVideoRef.current = event.target
    }
    const onEnterPip = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) {
        activeVideoRef.current = event.target
        setInPip(true)
      }
    }
    const onLeavePip = () => setInPip(false)

    document.addEventListener('play', onPlay, true)
    document.addEventListener('enterpictureinpicture', onEnterPip, true)
    document.addEventListener('leavepictureinpicture', onLeavePip, true)

    return () => {
      observer.disconnect()
      document.removeEventListener('play', onPlay, true)
      document.removeEventListener('enterpictureinpicture', onEnterPip, true)
      document.removeEventListener('leavepictureinpicture', onLeavePip, true)
    }
  }, [supported])

  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        return
      }
      const video = activeVideoRef.current
      if (!video) return
      if (video.readyState < 1) {
        await new Promise<void>((resolve) => {
          const done = () => {
            video.removeEventListener('loadedmetadata', done)
            resolve()
          }
          video.addEventListener('loadedmetadata', done)
          video.load()
        })
      }
      await video.requestPictureInPicture()
    } catch {}
  }

  return (
    <>
      {children}
      {supported && hasVideo && (
        <button
          type="button"
          onClick={togglePip}
          title={inPip ? 'Exit picture-in-picture' : 'Watch in picture-in-picture'}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2.5 text-xs font-semibold text-gray-800 shadow-lg backdrop-blur transition hover:bg-white hover:shadow-xl sm:bottom-6"
        >
          <PictureInPicture2 className="h-4 w-4 text-red-600" />
          {inPip ? 'Exit PiP' : 'Picture in Picture'}
        </button>
      )}
    </>
  )
}

export default PictureInPictureProvider
