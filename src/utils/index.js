/**
 * Convert any Node.js readable stream in to a blob
 * https://developer.mozilla.org/en-US/docs/Web/API/Blob
 *
 * @param {ReadableStream} stream
 * @param {String} mimeType
 * @returns {Promise<Blob>} Promise blob
 */
exports.streamToBlob = (stream, mimeType) => {
  if (mimeType != null && typeof mimeType !== 'string') {
    throw new Error('Invalid mimetype, expected string.');
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream
      .on('data', (chunk) => chunks.push(chunk))
      .once('end', () => {
        const blob =
          mimeType != null
            ? new Blob(chunks, { type: mimeType })
            : new Blob(chunks);
        resolve(blob);
      })
      .once('error', reject);
  });
};

/**
 * Convert any Node.js readable stream in to a blob url
 * https://developer.mozilla.org/en-US/docs/Web/API/Blob
 *
 * @param {ReadableStream} stream
 * @param {String} mimeType
 * @returns {Promise<String>} Promise blob url
 */
exports.getBlobURL = async (stream, mimeType) => {
  const blob = await this.streamToBlob(stream, mimeType);
  const url = URL.createObjectURL(blob);
  return url;
};

exports.readStream = async (stream) => {
  const reader = stream.getReader();
  let result = [];

  // read() returns a promise that resolves
  // when a value has been received
  const resultReader = reader.read();
  function processText({ done, value }) {
    // Result objects contain two properties:
    // done  - true if the stream has already given you all its data.
    // value - some data. Always undefined when done is true.
    if (done) {
      console.log('Stream complete');
      return;
    }

    result.push(value);

    // Read some more, and call this function again
    return reader.read().then(processText);
  }

  await processText(resultReader);
  return result;
};
