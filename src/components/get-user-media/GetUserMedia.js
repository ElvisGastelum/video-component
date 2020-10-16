import React, { useEffect, useRef, useState } from 'react';
import { GetUserMediaService } from './services';
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';
import { getBlobURL } from '../../utils';

export const GetUserMedia = () => {
  const videoRef = useRef(null);
  const videoList = useRef(null);
  const getUserMediaService = new GetUserMediaService({
    withAudio: false,
  });
  const [mediaRecorder, setMediaRecorder] = useState(undefined);
  const [chunks, setChunks] = useState([]);

  const onDataAvailable = ({ data }) => {
    if (data.size > 0) {
      setChunks((prevChunks) => prevChunks.push(data));
    }
  };

  const onStop = (e) => {
    const clipName = prompt('Enter a name for your sound clip');

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

    const blob = new Blob(chunks, { type: 'video/webm' });
    setChunks([]);
    const videoUrl = window.URL.createObjectURL(blob);
    video.src = videoUrl;

    deleteButton.onclick = function (e) {
      let evtTgt = e.target;
      evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
    };

    var fd = new FormData();
    fd.append('videoBlob', blob, 'video.webm');

    console.log('sending data to the server');
    fetch('http://localhost:3200/api/video', {
      method: 'POST',
      body: fd,
      headers: {
        // 'Content-Type': 'application/json'
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then(async (res) => {
      console.log('data received from the server');
      const stream = res.body;
      const nodeStream = new ReadableWebToNodeStream(stream);

      const url = await getBlobURL(nodeStream, 'video/webm');
      const a = document.createElement('a');
      a.style = 'display: none';
      a.href = url;
      a.download = 'video.webm';
      document.body.appendChild(a);
      console.log('downloading file comming from server');
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  useEffect(() => {
    async function init() {
      const mediaStream = await getUserMediaService.startStream();
      setMediaRecorder(
        getUserMediaService.createMediaRecorder({
          audioBitsPerSecond: 128000,
          videoBitsPerSecond: 2500000,
          mimeType: 'video/webm;codec=vp9',
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
