export const transaction = async (callback) => {
  if (typeof callback !== 'function') {
    throw new Error('A transaction callback is required');
  }

  return callback();
};

export default transaction;
