export function notFound(req, res) {
  res.status(404).json({ message: `No route matches ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Unexpected server error.";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(" ");
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Malformed identifier supplied.";
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `That ${field} is already in use.`;
  }

  if (err.name === "MulterError") {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is larger than the 4 MB limit."
        : err.message;
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired session.";
  }

  if (err.message === "Not allowed by CORS") {
    statusCode = 403;
  }

  if (statusCode >= 500) {
    console.error("[api:error]", err);
    if (process.env.NODE_ENV === "production") {
      message = "Unexpected server error.";
    }
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== "production" && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
}
