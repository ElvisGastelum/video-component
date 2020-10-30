export class WebRTCService {
  constructor(config) {
    const {
      getUserMediaService,
      mimeType = 'video/webm',
      stream,
      mediaRecorder,
    } = config;

    this.getUserMediaService = getUserMediaService;
    this.mimeType = mimeType;
    this.stream = stream;
    this.mediaRecorder = mediaRecorder;
  }

  startRecording(onStopCallback) {
    this.getUserMediaService.startRecording({
      onStopCallback,
      blobOptions: {
        type: this.mimeType,
      },
    });
  }

  stopRecording() {
    this.getUserMediaService.stopRecording();
  }
}