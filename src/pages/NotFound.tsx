/**
 * NotFound - Página 404
 * 
 * RISE Protocol V3 Compliant - Design Tokens
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createLogger } from "@/lib/logger";

const log = createLogger("NotFound");

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    log.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleReturnHome = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <button
          onClick={handleReturnHome}
          className="text-primary underline hover:text-primary/80 cursor-pointer"
        >
          {loading ? "Return to Home" : isAuthenticated ? "Return to Dashboard" : "Return to Home"}
        </button>
      </div>
    </div>
  );
};

export default NotFound;
