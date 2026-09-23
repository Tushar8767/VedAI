const { verifyToken, getUserById } = require("../services/authService");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const claims = verifyToken(token);

  if (!claims) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required."
      }
    });
  }

  const user = await getUserById(claims.sub);

  if (!user) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "The authenticated user no longer exists."
      }
    });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };
