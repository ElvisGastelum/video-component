import React from 'react';
import './DashVideoPlayer.css';

export const DashVideoPlayer = () => {
  return (
    <div className="dash-video-player-container">
      <video
        data-dashjs-player
        autoPlay
        src="https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
        controls
        className="dash-video-player"
      ></video>
    </div>
  );
};
