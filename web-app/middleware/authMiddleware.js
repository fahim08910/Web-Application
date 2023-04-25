const authMiddleware = (req, res, next) => {
  if (req.session.username || req.method === "GET" || req.path.startsWith('/points-of-interest/')) { 
    next();
  } else {
    res.status(401).json({ error: "You're not logged in. Go away!" });
  }
};
export default authMiddleware;