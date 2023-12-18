// try and catch method

// const asyncHandler = (requestHandler) => async (req, res, next) => {
// //   try {
// //     await requestHandler(req, res, next);
// //   } catch (error) {
// //     console.log(`Error Throw ${error}`);
// //     res.status(err.code || 500).json({
// //       success: false,
// //       message: err.message,
// //     });
// //   }
// };

// prmoise method

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
