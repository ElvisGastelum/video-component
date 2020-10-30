import { useEffect, useRef } from 'react';
import { WebRTCFactoryService } from '../services';
import { KILOBYTE, MEGABYTE } from '../services/utils';

export const useWebRTC = (config) => {
  const { videoRef, onStop } = config;

  const webRTCServiceRef = useRef(null);
  // const socketRef = useRef(socket);

  useEffect(() => {
    // const socket = socketRef.current;
    // socket.on('connect', function (socket) {
    //   console.info('Socket Connected');
    // });

    // socket.on('custom-message', (data) => {
    //   console.log('Custom Message: ', data);
    // });

    async function init() {
      const webRTCFactoryService = new WebRTCFactoryService({
        userMediaConfig: {
          withAudio: false,
        },
        videoConfig: {
          mimeType: 'video/webm',
          audioBitsPerSecond: 125 * KILOBYTE,
          videoBitsPerSecond: 2.5 * MEGABYTE,
        },
      });

      webRTCServiceRef.current = await webRTCFactoryService.getService();

      videoRef.current.srcObject = webRTCServiceRef.current.stream;
    }
    init();
  }, [videoRef]);

  const handleStartRecording = (event) => {
    webRTCServiceRef.current.startRecording(onStop);
    console.log('recorder started');
  };

  const handleStopRecording = (event) => {
    webRTCServiceRef.current.stopRecording();
    console.log('recorder stopped');
  };

  return { handleStartRecording, handleStopRecording };
};
