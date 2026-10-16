
export const adminOnly = (req, res, next) => {
  try {
    // Check whether the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in first.",
      });
    }

    // Check whether the user has admin permission
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin permission required.",
      });
    }

    // User is an admin, continue to the route
    return next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An error occurred while checking admin permissions.",
    });
  }
};
