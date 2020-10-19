import React, { useRef, useEffect } from 'react';
import { getBlobURL } from '../../utils';
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';

export const ImageStream = () => {
  const imgRef = useRef(null);
  const container = useRef(null);

  useEffect(() => {
    getPhoto();
    async function getPhoto() {
      const response = await fetch(
        'https://img.webmd.com/dtmcms/live/webmd/consumer_assets/site_images/article_thumbnails/reference_guide/why_cats_sneeze_ref_guide/1800x1200_why_cats_sneeze_ref_guide.jpg'
      );
      // const reader = response.body.getReader();
      // const result = await reader.read()

      // const stream = new ReadableStream({
      //   start(controller) {
      //     return pump();
      //     function pump() {
      //       return reader.read().then(({ done, value }) => {
      //         // When no more data needs to be consumed, close the stream
      //         if (done) {
      //           controller.close();
      //           return;
      //         }
      //         // Enqueue the next data chunk into our target stream
      //         controller.enqueue(value);
      //         return pump();
      //       });
      //     }
      //   },
      // });

      const result = response.body;

      const nodeStream = new ReadableWebToNodeStream(result);

      const url = await getBlobURL(nodeStream, 'image/jpeg');

      // const responseFetch = new Response(stream);

      // const imageBlog = await responseFetch.blob();
      // const imageBlog = await response.blob();

      // const blob = new Blob([result], { type: 'image/jpeg' });
      // const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cat.jpg';

      const button = document.createElement('button');
      button.textContent = 'Download cat🐱';

      a.appendChild(button);

      imgRef.current.src = url;
      container.current.appendChild(a);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', margin: '1em' }} ref={container}>
      <img
        alt="img"
        ref={imgRef}
        style={{ width: '50%', margin: '1em auto' }}
      />
    </div>
  );
};
