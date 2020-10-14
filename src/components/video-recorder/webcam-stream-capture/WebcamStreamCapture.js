import React, { useCallback, useRef, useState } from 'react';
import { Webcam } from '../react-webcam';

export const WebcamStreamCapture = () => {
  const webcamRef = useRef(null);
  const videoMediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const handleVideoDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    videoMediaRecorderRef.current = new MediaRecorder(
      webcamRef.current.stream,
      {
        mimeType: 'video/webm',
      }
    );

    videoMediaRecorderRef.current.addEventListener(
      'dataavailable',
      handleVideoDataAvailable
    );

    videoMediaRecorderRef.current.start();
  }, [handleVideoDataAvailable]);

  const handleStopCaptureClick = useCallback(() => {
    videoMediaRecorderRef.current.stop();
    setCapturing(false);
  }, [videoMediaRecorderRef, setCapturing]);

  const handleDownload = useCallback(() => {
    if (recordedChunks.length) {
      const videoBlob = new Blob(recordedChunks, {
        type: 'video/webm',
      });

      const videoUrl = URL.createObjectURL(videoBlob);
      const video = document.createElement('a');
      document.body.appendChild(video);
      video.style = 'display: none';
      video.href = videoUrl;
      video.download = 'react-webcam-stream-capture-video.webm';
      video.click();
      window.URL.revokeObjectURL(videoUrl);

      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  return (
    <>
      <Webcam audio ref={webcamRef} mirrored />
      {capturing ? (
        <button onClick={handleStopCaptureClick}>Stop Capture</button>
      ) : (
        <button onClick={handleStartCaptureClick}>Start Capture</button>
      )}
      {recordedChunks.length > 0 && (
        <button onClick={handleDownload}>Download</button>
      )}
    </>
  );
};
