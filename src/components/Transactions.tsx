import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Transactions: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [cookie, setCookie] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(event.target.value);
  };

  const handleCookieChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCookie(event.target.value);
  };

  useEffect(() => {
    const loadVideo = () => {
      if (Hls.isSupported() && videoRef.current) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch((error) => {
            toast.error(`Error playing video: ${error.message}`);
          });
        });
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = videoUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current?.play().catch((error) => {
            toast.error(`Error playing video: ${error.message}`);
          });
        });
      }
    };

    if (videoUrl) {
      if (cookie) {
        axios
          .get(videoUrl, {
            headers: {
              Cookie: cookie,
            },
          })
          .then(loadVideo)
          .catch((error) => {
            toast.error(`Error loading video with cookie: ${error.message}`);
          });
      } else {
        loadVideo();
      }
    }
  }, [videoUrl, cookie]);

  const handlePlay = () => {
    if (!videoUrl) {
      toast.error('Please enter a video URL');
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-md mb-4">
        <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
          Video URL:
        </label>
        <input
          type="text"
          id="videoUrl"
          value={videoUrl}
          onChange={handleUrlChange}
          placeholder="Enter video URL"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div className="w-full max-w-md mb-4">
        <label htmlFor="cookie" className="block text-sm font-medium text-gray-700">
          Cookie (optional):
        </label>
        <input
          type="text"
          id="cookie"
          value={cookie}
          onChange={handleCookieChange}
          placeholder="Enter cookie"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <button
        onClick={handlePlay}
        className="mb-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Play Video
      </button>
      <div className="w-full max-w-2xl">
        <video ref={videoRef} controls width="100%" className="rounded-md shadow-md">
          Your browser does not support the video tag.
        </video>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Transactions;
