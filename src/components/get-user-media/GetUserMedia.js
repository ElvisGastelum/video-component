import React, { useRef } from 'react';
// import io from 'socket.io-client';

import { createVideoContainer } from './utils';
import { useWebRTC } from './hooks';

// const socket = io('http://localhost:3200/');

export const GetUserMedia = () => {
  const videoRef = useRef(null);
  const videoList = useRef(null);
  const { handleStartRecording, handleStopRecording } = useWebRTC({
    videoRef,
    // socket,
    onStop,
  });

  function onStop(blob) {
    const clipName = prompt('Enter a name for your sound clip');

    const videoUrl = window.URL.createObjectURL(blob);
    const videoContainer = createVideoContainer(videoUrl, clipName);

    videoList.current.appendChild(videoContainer);

    console.log('sending data to the server');

    // socket.emit('upload-video', {
    //   videoBlob: blob,
    //   videoName: clipName,
    // });
  }

  return (
    <div>
      <video controls autoPlay ref={videoRef}></video>
      <button onClick={handleStartRecording}>Start Recording</button>
      <button onClick={handleStopRecording}>Stop Recording</button>
      <div className="videoclips" ref={videoList}></div>
    </div>
  );
};
