export const createVideoContainer = (videoUrl, clipName) => {
  const clipContainer = document.createElement('article');
  const clipLabel = document.createElement('p');
  const video = document.createElement('video');
  const deleteButton = document.createElement('button');

  clipContainer.classList.add('clip');
  video.setAttribute('controls', '');
  video.src = videoUrl;
  deleteButton.innerHTML = 'Delete';
  clipLabel.innerHTML = clipName;

  clipContainer.appendChild(video);
  clipContainer.appendChild(clipLabel);
  clipContainer.appendChild(deleteButton);

  deleteButton.onclick = function (e) {
    let evtTgt = e.target;
    evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
  };

  return clipContainer;
};