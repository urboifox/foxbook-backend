module.exports = (message, statusCode, statusMessage) => {
  const err = {
    message,
    statusCode,
    statusMessage,
  };
  return err;
};
