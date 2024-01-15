import React, { useState, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FileBase64 from "react-file-base64";

const Transactions = () => {
  const [userId, setUserId] = useState<string>("");
  const [videoData, setVideoData] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any | null>(null);
  const [detailsResponse, setDetailsResponse] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUserIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(event.target.value);
  };

  const handleVideoUpload = (file: { base64: string }) => {
    setVideoData(file.base64);
  };

  const handleUpload = async () => {
    if (!userId || !videoData) {
      toast.error("Please enter user ID and select a video");
      return;
    }

    const uploadEndpoint = `https://kl8no40qhb.execute-api.eu-west-2.amazonaws.com/dev/user/uploadUserShortVideo?user_id=${userId}`;

    try {
      setLoading(true);
      const response = await axios.post(uploadEndpoint, { videoData: videoData.split(",")[1] });
      setUploadResponse(response.data);
      toast.success("Video uploaded successfully!");
    } catch (error: any) {
      console.error("Error during upload:", error);

      if (error.response) {
        toast.error(`Error during upload: ${error.response.data.message}`);
      } else if (error.request) {
        toast.error("Error getting video details. Please try again later.");
      } else {
        toast.error("Unexpected error uploading video. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetDetails = async () => {
    if (!uploadResponse) {
      toast.error("Please upload a video first");
      return;
    }

    try {
      setLoading(true);
      // Hit the details endpoint once
      const detailsEndpoint = `https://kl8no40qhb.execute-api.eu-west-2.amazonaws.com/dev/user/findUserShortVideo?item_id=${uploadResponse.data.item_id}`;
      const detailsResponse = await axios.get(detailsEndpoint);
      setDetailsResponse(detailsResponse.data);

      // Auto-load the uploaded video into the video player
      if (videoRef.current) {
        // Assuming the video URL is correctly returned from the API
        const videoUrl = detailsResponse.data.data.videoS3Url;
        videoRef.current.src = videoUrl;
        videoRef.current.load();
        videoRef.current.play(); // Auto-play the video if needed
      }
    } catch (error: any) {
      console.error("Error getting video details:", error);
      toast.error("Error getting video details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col md:pt-15 pt-5'>
      <div className='flex flex-col md:flex-row justify-between gap-4'>
        <div className='text-neutral-900 flex flex-col gap-4 md:flex'>
          <div>
            <p className='font-[degularbold] md:text-2xl text-xl'>Upload Video Logic</p>
            <p className='font-[degularmedium] text-gray-600'>
              Your video is uploaded when you select a video and click upload video. After it is done uploading a button appears allowing you to get a
              video details.
              <br />
              This video details is the result of the background Lambda functions that are triggered when a video is uploaded. It gives the video
              labels based on the uploaded video (AWS rekognition and redshift) and the adaptive bitrates of the video (FFMPEG)
            </p>
          </div>
          <div>
            <input
              className='bg-gray-100 text-neutral-900 p-4 items-center flex gap-2 rounded-full font-[degularsemibold] h-12'
              onChange={handleUserIdChange}
              placeholder='Enter User ID'
            />
          </div>
        </div>
        <div className='flex flex-col gap-2 md:w-1/2'>
          <div className='mt-4'>
            <p className='font-[degularsemibold] text-xl'>Select Video</p>
            <div className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500'>
              <FileBase64 multiple={false} onDone={handleVideoUpload} />
            </div>
          </div>
          <button
            onClick={handleUpload}
            className='w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:border-blue-500'
          >
            Upload Video
          </button>
          <button
            onClick={handleGetDetails}
            className='w-full bg-green-500 text-white p-2 rounded-md mt-4 hover:bg-blue-700 focus:outline-none focus:ring focus:border-blue-500'
          >
            Get Details
          </button>
        </div>
      </div>
      <div className='w-full border-t mt-4 border-gray-300' />

      {loading && (
        <div className='mt-4 flex justify-center'>
          <p className='text-lg font-bold mb-2'>Loading...</p>
        </div>
      )}

      {uploadResponse && (
        <div className='mt-4'>
          <h2 className='text-lg font-bold mb-2'>Upload Response:</h2>
          <div>{/* Add any additional elements or styling here if needed */}</div>
          <pre className='bg-gray-100 p-4 text-sm rounded-md'>{JSON.stringify(uploadResponse, null, 2)}</pre>
        </div>
      )}

      {detailsResponse && (
        <div className='mt-4'>
          <h2 className='text-lg font-bold mb-2'>Full Video Details:</h2>
          <div>{/* Add any additional elements or styling here if needed */}</div>
          <pre className='bg-gray-100 p-4 text-sm rounded-md'>{JSON.stringify(detailsResponse, null, 2)}</pre>
        </div>
      )}

      {/* Video player section */}
      <div className='mt-4'>
        <h2 className='text-lg font-bold mb-2'>Uploaded Video:</h2>
        <video ref={videoRef} controls width='100%' height='auto'>
          Your browser does not support the video tag.
        </video>
      </div>
      
      <ToastContainer />
    </div>
  );
};

export default Transactions;
