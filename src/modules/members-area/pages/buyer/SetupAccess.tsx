/**
 * SetupAccess - Intelligent access setup page for members area
 * 
 * RISE Protocol V2 Compliant - Refactored from 527 to ~60 lines
 * 
 * Flow:
 * 1. Validate token
 * 2. Check if user is already logged in (local session)
 * 3. If logged in with same email → grant access automatically
 * 4. If logged in with different email → show switch account prompt
 * 5. If user has password but not logged in → redirect to login
 * 6. If user needs password setup → show password creation form
 */

import { useSetupAccess } from "./setup-access/hooks/useSetupAccess";
import {
  SetupLoadingState,
  SetupAlreadyLoggedCorrect,
  SetupAlreadyLoggedWrong,
  SetupNeedsLogin,
  SetupErrorState,
  SetupPasswordForm,
} from "./setup-access/components";

export default function SetupAccess() {
  const {
    status,
    tokenInfo,
    loggedBuyer,
    errorMessage,
    password,
    confirmPassword,
    showPassword,
    isSubmitting,
    isGrantingAccess,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    handleLogoutAndContinue,
    redirectToLogin,
    handleSubmit,
    navigateToDashboard,
    navigateToLogin,
  } = useSetupAccess();

  if (status === "loading") {
    return <SetupLoadingState />;
  }

  if (status === "already-logged-correct") {
    return <SetupAlreadyLoggedCorrect isGrantingAccess={isGrantingAccess} />;
  }

  if (status === "already-logged-wrong") {
    return (
      <SetupAlreadyLoggedWrong
        loggedBuyer={loggedBuyer}
        tokenInfo={tokenInfo}
        onLogoutAndContinue={handleLogoutAndContinue}
        onNavigateToDashboard={navigateToDashboard}
      />
    );
  }

  if (status === "needs-login") {
    return <SetupNeedsLogin tokenInfo={tokenInfo} onRedirectToLogin={redirectToLogin} />;
  }

  if (status === "invalid" || status === "used" || status === "expired") {
    return <SetupErrorState status={status} errorMessage={errorMessage} onNavigateToLogin={navigateToLogin} />;
  }

  // Valid token - show password setup form
  return (
    <SetupPasswordForm
      tokenInfo={tokenInfo}
      password={password}
      confirmPassword={confirmPassword}
      showPassword={showPassword}
      isSubmitting={isSubmitting}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onToggleShowPassword={() => setShowPassword(!showPassword)}
      onSubmit={handleSubmit}
    />
  );
}
