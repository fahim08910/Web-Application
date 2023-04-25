const permissionMiddleware = (req, res, next) => {
    if (req.session.username) {
      next();
    } else {
      res.status(401).json({ error: "Please log in to perform this action." });
    }
  };
  
  export default permissionMiddleware;
