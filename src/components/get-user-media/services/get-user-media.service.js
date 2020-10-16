export class GetUserMediaService {
  mediaRecorder = null;
  stream = null;
  chunks = null;

  constructor({ withVideo, withAudio }) {
    this.withVideo = withVideo;
    this.withAudio = withAudio;
  }

  hasUserMedia() {
    //check if the browser supports the WebRTC
    return !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia
    );
  }

  streamMedia = async () => {
    const { hasUserMedia } = this;

    if (hasUserMedia()) {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;

      //enabling video and audio channels
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: typeof this.withVideo !== 'undefined' ? this.withVideo : true,
        audio: typeof this.withAudio !== 'undefined' ? this.withAudio : true,
      });

      return mediaStream;
    } else {
      alert('WebRTC is not supported');
    }
  };

  startStream = async () => {
    if (!this.stream) {
      this.stream = await this.streamMedia();
    }
    return this.stream;
  };

  createMediaRecorder = ({...options}) => {
    if (!this.stream) {
      throw new Error('You need start an stream before create MediaRecorder');
    }
    this.mediaRecorder = new MediaRecorder(this.stream, { ...options });
    return this.mediaRecorder;
  };
}
