import React, { useEffect, useRef, useState } from 'react';
import { GetUserMediaService } from './services';
import io from 'socket.io-client';
const socket = io('http://localhost:3200/');

export const GetUserMedia = () => {
  const videoRef = useRef(null);
  const videoList = useRef(null);
  const getUserMediaService = useRef(null);
  const [mediaRecorder, setMediaRecorder] = useState(undefined);
  const [chunks, setChunks] = useState([]);

  const onDataAvailable = ({ data }) => {
    if (data.size > 0) {
      setChunks((prevChunks) => prevChunks.push(data));
    }
  };

  const onStop = (e) => {
    const clipName = prompt('Enter a name for your sound clip');
    const blob = new Blob(chunks, { type: 'video/webm' });

    const clipContainer = document.createElement('article');
    const clipLabel = document.createElement('p');
    const video = document.createElement('video');
    const deleteButton = document.createElement('button');

    clipContainer.classList.add('clip');
    video.setAttribute('controls', '');
    deleteButton.innerHTML = 'Delete';
    clipLabel.innerHTML = clipName;

    clipContainer.appendChild(video);
    clipContainer.appendChild(clipLabel);
    clipContainer.appendChild(deleteButton);
    videoList.current.appendChild(clipContainer);

    setChunks([]);
    const videoUrl = window.URL.createObjectURL(blob);
    console.log(videoUrl);
    video.src = videoUrl;

    deleteButton.onclick = function (e) {
      let evtTgt = e.target;
      evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
    };

    console.log('sending data to the server');

    socket.emit('upload-video', {
      videoBlob: blob,
      videoName: clipName,
    });
  };

  useEffect(() => {
    socket.on('connect', function (socket) {
      console.info('Socket Connected');
    });

    socket.on('custom-message', (data) => {
      console.log('Custom Message: ', data);
    });

    async function init() {
      getUserMediaService.current = new GetUserMediaService({
        withAudio: true,
      });
      const mediaStream = await getUserMediaService.current.startStream();
      setMediaRecorder(
        getUserMediaService.current.createMediaRecorder({
          audioBitsPerSecond: 128000,
          videoBitsPerSecond: 2500000,
          mimeType: 'video/webm',
        })
      );
      videoRef.current.srcObject = mediaStream;
    }
    init();
  }, []);

  const handleStartRecording = (event) => {
    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = onStop;
    mediaRecorder.start();
    console.log(mediaRecorder.state);
    console.log('recorder started');
  };

  const handleStopRecording = (event) => {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log('recorder stopped');
  };

  return (
    <div>
      <video controls autoPlay ref={videoRef}></video>
      <button onClick={handleStartRecording}>Start Recording</button>
      <button onClick={handleStopRecording}>Stop Recording</button>
      <div className="videoclips" ref={videoList}></div>
    </div>
  );
};
