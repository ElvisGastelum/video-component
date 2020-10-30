// const iceServers = {
//   iceServer: [
//     { urls: 'stun:stun.services.mozilla.com' },
//     { urls: 'stun:stun.l.google.com:19302' },
//   ],
// };
import { ConnectionClient } from './connection.service';

export class PeerConnection {
  constructor(config) {
    const { getUserMedia, peerConnection } = config;

    this.getUserMedia = getUserMedia;
    this.peerConnection = peerConnection;
  }
}

PeerConnection.create = async function create(config) {
  const { getUserMedia } = config;

  function beforeAnswer(peerConnection) {
    getUserMedia.stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, getUserMedia.stream));

    // NOTE(mroberts): This is a hack so that we can get a callback when the
    // RTCPeerConnection is closed. In the future, we can subscribe to
    // "connectionstatechange" events.
    const { close } = peerConnection;
    peerConnection.close = function () {
      getUserMedia.stream.getTracks().forEach((track) => track.stop());

      return close.apply(this, arguments);
    };
  }

  const connectionClient = new ConnectionClient({
    host: 'http://localhost:3200',
  });

  const peerConnection = await connectionClient.createConnection({
    beforeAnswer,
  });

  return new PeerConnection({ getUserMedia, peerConnection });
};
