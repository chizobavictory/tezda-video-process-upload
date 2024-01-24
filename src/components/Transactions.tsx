import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FileBase64 from "react-file-base64";

const Transactions = () => {
  const [userId, setUserId] = useState<string>("");
  const [videoData, setVideoData] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any | null>(null);
  const [detailsResponse, setDetailsResponse] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeTaken, setTimeTaken] = useState<number | null>(null); // Added state for time taken
  const [video360pUrl, setVideo360pUrl] = useState<string | null>(null);
  const [video540pUrl, setVideo540pUrl] = useState<string | null>(null);
  const [video720pUrl, setVideo720pUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [userIpAddress, setUserIpAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const response = await axios.get("https://ipinfo.io/json");
        console.log("Response from IP info:", response);
        setUserCountry(response.data.country);
        setUserIpAddress(response.data.ip);
      } catch (error) {
        console.error("Error fetching user country:", error);
      }
    };

    fetchUserCountry();
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUserIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(event.target.value);
  };

  const getItemIdFromPresignedUrl = (presignedUrl: string) => {
    try {
      const url = new URL(presignedUrl);
      const path = url.pathname;
      const pathParts = path.split("/");
      const fileName = pathParts[pathParts.length - 1];
      // Remove the file extension, assuming it's always ".mp4"
      const itemId = fileName.replace(/\.mp4$/, "");
      return itemId;
    } catch (error) {
      console.error("Error extracting item ID from presigned URL:", error);
      return null;
    }
  };

  const handleVideoUpload = (file: { file: File }) => {
    setVideoData(file.file);
  };

  const handleUpload = async () => {
    if (!userId || !videoData) {
      toast.error("Please enter user ID and select a video");
      return;
    }

    const presignedUrlEndpoint = `https://kl8no40qhb.execute-api.eu-west-2.amazonaws.com/dev/user/createUserUploadPresignedUrl?user_id=${userId}`;

    try {
      setLoading(true);

      // Step 1: Request a presigned URL
      const presignedUrlResponse = await axios.post(presignedUrlEndpoint);
      console.log("Response from presigned URL request:", presignedUrlResponse);
      const user_id = presignedUrlResponse.data.user_id;
      const presignedUrl = presignedUrlResponse.data.data;

      const location = userCountry || "N/A";
      const ipAddress = userIpAddress || "N/A";

      // Step 2: Upload the video to S3 using the presigned URL
      console.log("Uploading video data:", videoData);
      await axios.put(presignedUrl, videoData, {
        headers: {
          "Content-Type": "video/mp4",
          "Access-Control-Allow-Origin": "*",
          "x-amz-meta-user-id": userId,
          "x-amz-meta-location": location,
          "x-amz-meta-ip-address": ipAddress,
          // Add more metadata headers as needed
        },
      });
      const item_id = getItemIdFromPresignedUrl(presignedUrl);

      // Step 3: After a successful upload, you can now trigger other actions or display a success message.
      setUploadResponse({ message: "Video uploaded successfully", data: { presignedUrl, item_id, user_id } });
      toast.success("Video uploaded successfully!");
    } catch (error: any) {
      console.error("Error during upload:", error);

      if (error.response) {
        toast.error(`Error during upload: ${error.response.data.message}`);
      } else {
        toast.error("Unexpected error uploading video. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const expectedAttributes = [
    "item_id",
    "parentLabels",
    "creation_timestamp",
    "genre",
    "video_duration",
    "adaptiveBitrateS3Url",
    "adaptiveBitrateS3Url720p",
    "childLabels",
    "adaptiveBitrateS3Url360p",
    "videoS3Url",
    "user_id",
    "adaptiveBitrateS3Url540p",
  ];

  const handleGetDetails = async () => {
    const startTime = performance.now();
    if (!uploadResponse) {
      toast.error("Please upload a video first");
      return;
    }

    try {
      setLoadingMessage("Loading all video details...");
      setLoading(true);
      toast.info("Loading all video details...");

      // Hit the details endpoint once
      const detailsEndpoint = `https://kl8no40qhb.execute-api.eu-west-2.amazonaws.com/dev/user/findUserShortVideo?item_id=${uploadResponse.data.item_id}`;
      const detailsResponse = await axios.get(detailsEndpoint);

      setDetailsResponse(detailsResponse.data);
      const endTime = performance.now();

      // Check completeness of the response
      const isResponseComplete = expectedAttributes.every((attr) => attr in detailsResponse.data.data);

      if (isResponseComplete) {
        toast.success("Video details loaded successfully!");
        // Calculate and update the time taken
        const timeTaken = (endTime - startTime) / 100; // Convert to seconds
        setTimeTaken(timeTaken);

        // Set video URLs
        setVideo360pUrl(detailsResponse.data.data.adaptiveBitrateS3Url360p);
        setVideo540pUrl(detailsResponse.data.data.adaptiveBitrateS3Url540p);
        setVideo720pUrl(detailsResponse.data.data.adaptiveBitrateS3Url720p);

        // Auto-load the uploaded video into the video player
        if (videoRef.current) {
          // Assuming the video URL is correctly returned from the API
          const videoUrl = detailsResponse.data.data.videoS3Url;
          videoRef.current.src = videoUrl;
          videoRef.current.load();
          videoRef.current.play(); // Auto-play the video if needed
        }
      } else {
        setLoadingMessage("Loading all video details...");
        console.log(
          "Incomplete response. Missing attributes:",
          expectedAttributes.filter((attr) => !(attr in detailsResponse.data.data))
        );
        // toast.error("Incomplete response. Give it some time.");
      }
    } catch (error) {
      // toast.error("Error getting video details. Please try again later.");
      console.error("Error getting video details:", error);
      setLoadingMessage("Error getting video details. Please try again later.");
    } finally {
      setLoading(false);
      setLoadingMessage(null); // Reset loading message after handling response
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
          <p className='text-lg font-bold mb-2'>{loadingMessage || "Loading..."}</p>
        </div>
      )}

      <div className='mt-4 '>
        <div className='flex justify-between'>
          <div>
            <h2 className='text-lg font-bold mb-2'>Time Taken to Get details:</h2>
            <div>{timeTaken !== null ? `${timeTaken.toFixed(2)} seconds` : "N/A"}</div>
          </div>
          <div>
            <h2 className='text-lg font-bold mb-2'>Video upload location:</h2>
            <div>{userCountry || "N/A"}</div>
          </div>
          <div>
            <h2 className='text-lg font-bold mb-2'>Video upload IP:</h2>
            <div>{userIpAddress || "N/A"}</div>
          </div>
        </div>
      </div>

      {uploadResponse && (
        <div className='mt-4 '>
          <h2 className='text-lg font-bold mb-2'>Upload Response:</h2>
          <div>{/* Add any additional elements or styling here if needed */}</div>
          <pre className='bg-gray-100 overflow-auto p-4 text-sm rounded-md'>{JSON.stringify(uploadResponse, null, 2)}</pre>
        </div>
      )}

      {detailsResponse && detailsResponse.data && expectedAttributes.every((attr) => attr in detailsResponse.data) && (
        <div className='mt-4 '>
          <h2 className='text-lg font-bold mb-2'>Full Video Details:</h2>
          <div>{/* Add any additional elements or styling here if needed */}</div>
          <pre className='bg-gray-100 overflow-auto p-4 text-sm rounded-md'>{JSON.stringify(detailsResponse, null, 2)}</pre>
        </div>
      )}

      {/* Video player section */}
      <div className='flex justify-between mt-4'>
        <div>
          <h2 className='text-lg font-bold mb-2'>Video Details 360p:</h2>
          {video360pUrl && (
            <video controls width='100%' height='auto'>
              <source src={video360pUrl} type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        <div>
          <h2 className='text-lg font-bold mb-2'>Video Details 540p:</h2>
          {video540pUrl && (
            <video controls width='100%' height='auto'>
              <source src={video540pUrl} type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        <div>
          <h2 className='text-lg font-bold mb-2'>Video Details 720p:</h2>
          {video720pUrl && (
            <video controls width='100%' height='auto'>
              <source src={video720pUrl} type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>

      <div className='mt-4'>
        <h2 className='text-lg font-bold mb-2'>Original Uploaded Video:</h2>
        <video ref={videoRef} controls width='100%' height='auto'>
          Your browser does not support the video tag.
        </video>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Transactions;
