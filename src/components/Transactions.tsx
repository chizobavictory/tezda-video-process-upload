import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FileBase64 from "react-file-base64";

const Transactions = () => {
  const [userId, setUserId] = useState<string>("");
  const [videoData, setVideoData] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any | null>(null); // Added state for response details

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

    const endpoint = `https://kl8no40qhb.execute-api.eu-west-2.amazonaws.com/dev/user/uploadUserShortVideo?user_id=${userId}`;

    try {
      const response = await axios.post(endpoint, { videoData: videoData.split(",")[1] }); // Extract base64 string
      setUploadResponse(response.data); // Update response details state
      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Error uploading video. Please try again.");
    }
  };

  return (
    <div className='flex flex-col md:pt-15 pt-5'>
      <div className='flex flex-col md:flex-row justify-between gap-4'>
        <div className='text-neutral-900 flex flex-col gap-4 md:flex'>
          <div>
            <p className='font-[degularbold] md:text-2xl text-xl'>Upload Video Logic</p>
            <p className='font-[degularmedium] text-gray-600'>
              Your video is uploaded in one API call taking in the userId, and then that user Id is used for a second API call that gets the item
              details from the db that includes the data gotten from the other background processes run like the adaptive bitrates and the labels
              generated from AWS Rekognition{" "}
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
        </div>
      </div>
      <div className='w-full border-t mt-4 border-gray-300' />

      {uploadResponse && (
        <div className='mt-4'>
          <h2 className='text-lg font-bold mb-2'>Upload Response:</h2>
          <div>
            {/* Add any additional elements or styling here if needed */}
          </div>
          <pre className='bg-gray-100 p-4 text-sm rounded-md'>{JSON.stringify(uploadResponse, null, 2)}</pre>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default Transactions;
