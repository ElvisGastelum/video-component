import React, { Component } from 'react';

// polyfill based on https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
(function polyfillGetUserMedia() {
  if (typeof window === 'undefined') {
    return;
  }

  // Older browsers might not implement mediaDevices at all, so we set an empty object first
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get ahold of the legacy getUserMedia, if present
      const getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia) {
        return Promise.reject(
          new Error('getUserMedia is not implemented in this browser')
        );
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
})();

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export class Webcam extends Component {
  static defaultProps = {
    audio: true,
    forceScreenshotSourceSize: false,
    imageSmoothing: true,
    mirrored: false,
    onUserMedia: () => {},
    onUserMediaError: () => {},
    screenshotFormat: 'image/webp',
    screenshotQuality: 0.92,
  };

  canvas = null;
  ctx = null;
  unmounted = false;
  stream;
  video;

  constructor(props) {
    super(props);
    this.state = {
      hasUserMedia: false,
    };
  }

  componentDidMount() {
    const {
      state: { hasUserMedia },
      props: { onUserMediaError },
    } = this;

    if (!hasGetUserMedia()) {
      onUserMediaError('getUserMedia not supported');

      return;
    }

    if (!hasUserMedia) {
      this.requestUserMedia();
    }
  }

  componentDidUpdate(nextProps) {
    const { props } = this;

    if (!hasGetUserMedia()) {
      props.onUserMediaError('getUserMedia not supported');

      return;
    }

    const audioConstraintsChanged =
      JSON.stringify(nextProps.audioConstraints) !==
      JSON.stringify(props.audioConstraints);
    const videoConstraintsChanged =
      JSON.stringify(nextProps.videoConstraints) !==
      JSON.stringify(props.videoConstraints);
    const minScreenshotWidthChanged =
      nextProps.minScreenshotWidth !== props.minScreenshotWidth;
    const minScreenshotHeightChanged =
      nextProps.minScreenshotHeight !== props.minScreenshotHeight;
    if (
      videoConstraintsChanged ||
      minScreenshotWidthChanged ||
      minScreenshotHeightChanged
    ) {
      this.canvas = null;
      this.ctx = null;
    }
    if (audioConstraintsChanged || videoConstraintsChanged) {
      this.stopAndCleanup();
      this.requestUserMedia();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.stopAndCleanup();
  }

  static stopMediaStream(stream) {
    if (stream) {
      if (stream.getVideoTracks && stream.getAudioTracks) {
        stream.getVideoTracks().map((track) => track.stop());
        stream.getAudioTracks().map((track) => track.stop());
      } else {
        stream.stop();
      }
    }
  }

  stopAndCleanup() {
    const {
      state: { hasUserMedia, src },
    } = this;

    if (hasUserMedia) {
      Webcam.stopMediaStream(this.stream);

      if (src) {
        window.URL.revokeObjectURL(src);
      }
    }
  }

  getScreenshot(screenshotDimensions) {
    const {
      state: { hasUserMedia },
      props: { screenshotFormat, screenshotQuality },
    } = this;

    if (!hasUserMedia) return null;

    const canvas = this.getCanvas(screenshotDimensions);
    return canvas && canvas.toDataURL(screenshotFormat, screenshotQuality);
  }

  getCanvas(screenshotDimensions) {
    const {
      state: { hasUserMedia },
      props: {
        forceScreenshotSourceSize,
        minScreenshotWidth,
        minScreenshotHeight,
        mirrored,
        imageSmoothing,
      },
      video,
    } = this;
    let { ctx, canvas } = this;
    const { videoHeight, videoWidth, clientWidth } = video;

    if (!video) {
      return null;
    }

    if (!hasUserMedia || !videoHeight) return null;

    if (!ctx) {
      let canvasWidth = videoWidth;
      let canvasHeight = videoHeight;
      if (!forceScreenshotSourceSize) {
        const aspectRatio = canvasWidth / canvasHeight;

        canvasWidth = minScreenshotWidth || clientWidth;
        canvasHeight = canvasWidth / aspectRatio;

        if (minScreenshotHeight && canvasHeight < minScreenshotHeight) {
          canvasHeight = minScreenshotHeight;
          canvasWidth = canvasHeight * aspectRatio;
        }
      }

      canvas = document.createElement('canvas');
      canvas.width = screenshotDimensions.width || canvasWidth;
      canvas.height = screenshotDimensions.height || canvasHeight;
      ctx = canvas.getContext('2d');
    }

    if (ctx && canvas) {
      // mirror the screenshot
      if (mirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.imageSmoothingEnabled = imageSmoothing;
      ctx.drawImage(
        video,
        0,
        0,
        screenshotDimensions.width || canvas.width,
        screenshotDimensions.height || canvas.height
      );

      // invert mirroring
      if (mirrored) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
      }
    }

    return canvas;
  }

  requestUserMedia() {
    const { props } = this;

    const sourceSelected = (audioConstraints, videoConstraints) => {
      const constraints = {
        video:
          typeof videoConstraints !== 'undefined' ? videoConstraints : true,
      };

      if (props.audio) {
        constraints.audio =
          typeof audioConstraints !== 'undefined' ? audioConstraints : true;
      }

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          if (this.unmounted) {
            Webcam.stopMediaStream(stream);
          } else {
            this.handleUserMedia(null, stream);
          }
        })
        .catch((e) => {
          this.handleUserMedia(e);
        });
    };

    if ('mediaDevices' in navigator) {
      sourceSelected(props.audioConstraints, props.videoConstraints);
    } else {
      const optionalSource = (id) => ({ optional: [{ sourceId: id }] });

      const constraintToSourceId = (constraint) => {
        const { deviceId } = constraint;

        if (typeof deviceId === 'string') {
          return deviceId;
        }

        if (Array.isArray(deviceId) && deviceId.length > 0) {
          return deviceId[0];
        }

        if (typeof deviceId === 'object' && deviceId.ideal) {
          return deviceId.ideal;
        }

        return null;
      };

      // @ts-ignore: deprecated api
      MediaStreamTrack.getSources((sources) => {
        let audioSource = null;
        let videoSource = null;

        sources.forEach((source) => {
          if (source.kind === 'audio') {
            audioSource = source.id;
          } else if (source.kind === 'video') {
            videoSource = source.id;
          }
        });

        const audioSourceId = constraintToSourceId(props.audioConstraints);
        if (audioSourceId) {
          audioSource = audioSourceId;
        }

        const videoSourceId = constraintToSourceId(props.videoConstraints);
        if (videoSourceId) {
          videoSource = videoSourceId;
        }

        sourceSelected(
          optionalSource(audioSource),
          optionalSource(videoSource)
        );
      });
    }
  }

  handleUserMedia(err, stream) {
    const { props } = this;

    if (err || !stream) {
      this.setState({ hasUserMedia: false });
      props.onUserMediaError(err);

      return;
    }

    this.stream = stream;

    try {
      if (this.video) {
        this.video.srcObject = stream;
      }
      this.setState({ hasUserMedia: true });
    } catch (error) {
      this.setState({
        hasUserMedia: true,
        src: window.URL.createObjectURL(stream),
      });
    }

    props.onUserMedia(stream);
  }

  render() {
    const { state, props } = this;

    const {
      audio,
      forceScreenshotSourceSize,
      onUserMedia,
      onUserMediaError,
      screenshotFormat,
      screenshotQuality,
      minScreenshotWidth,
      minScreenshotHeight,
      audioConstraints,
      videoConstraints,
      imageSmoothing,
      mirrored,
      style = {},
      ...rest
    } = props;

    const videoStyle = mirrored
      ? { ...style, transform: `${style.transform || ''} scaleX(-1)` }
      : style;

    return (
      <video
        autoPlay
        src={state.src}
        muted={audio}
        playsInline
        ref={(ref) => {
          this.video = ref;
        }}
        style={videoStyle}
        {...rest}
      />
    );
  }
}
