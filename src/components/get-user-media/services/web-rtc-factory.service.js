import { WebRTCService } from './web-rtc.service';
import { GetUserMediaService } from './get-user-media.service';
import { AbstractServiceFactory } from './abstract-factory';
import { PeerConnection } from './connection/peer-connection.service';
import { KILOBYTE, MEGABYTE } from './utils';

export class WebRTCFactoryService extends AbstractServiceFactory {
  serviceConstructor(config) {
    return async function () {
      const {
        userMediaConfig,
        videoConfig: {
          mimeType,
          audioBitsPerSecond = 125 * KILOBYTE,
          videoBitsPerSecond = 2.5 * MEGABYTE,
        },
      } = config;

      this.getUserMediaService = new GetUserMediaService(userMediaConfig);

      const stream = await this.getUserMediaService.startStream();
      const mediaRecorder = this.getUserMediaService.createMediaRecorder({
        audioBitsPerSecond,
        videoBitsPerSecond,
        mimeType,
      });

      this.peerConnection = await PeerConnection.create({
        getUserMedia: this.getUserMediaService,
      });

      const webRTCConfig = {
        getUserMediaService: this.getUserMediaService,
        peerConnection: this.peerConnection,
        stream,
        mediaRecorder,
      };

      return await new WebRTCService(webRTCConfig);
    };
  }
}
