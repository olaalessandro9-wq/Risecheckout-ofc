/**
 * CadastroPage - Unified registration page with profile quiz
 * 
 * RISE ARCHITECT PROTOCOL V3 - Main orchestrator component
 * 
 * Todos os subcomponentes são importados de module-scope,
 * garantindo referências estáveis que NÃO causam remount
 * quando useUnifiedAuth dispara re-render.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { AnimatePresence } from "framer-motion";
import { ProducerRegistrationForm } from "@/components/auth/ProducerRegistrationForm";

// Module-scope components (referências estáveis)
import { CadastroLayout } from "./components/CadastroLayout";
import { ChooseProfileView } from "./components/ChooseProfileView";
import { AlreadyHasAccountView } from "./components/AlreadyHasAccountView";

type ViewType = "choose-profile" | "already-has-account" | "producer-form";

export function CadastroPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const [view, setView] = useState<ViewType>("choose-profile");
  const [registrationSource, setRegistrationSource] = useState<"producer" | "affiliate">("producer");

  // Check URL param for direct access to producer/affiliate form
  useEffect(() => {
    const perfil = searchParams.get("perfil");
    if (perfil === "produtor") {
      setRegistrationSource("producer");
      setView("producer-form");
    } else if (perfil === "afiliado") {
      setRegistrationSource("affiliate");
      setView("producer-form");
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleBuyerChoice = () => {
    setView("already-has-account");
  };

  const handleProducerChoice = () => {
    setRegistrationSource("producer");
    setView("producer-form");
  };

  const handleAffiliateChoice = () => {
    setRegistrationSource("affiliate");
    setView("producer-form");
  };

  const handleBackToQuiz = () => {
    setView("choose-profile");
  };

  return (
    <CadastroLayout view={view} registrationSource={registrationSource}>
      <AnimatePresence mode="wait">
        {view === "choose-profile" && (
          <ChooseProfileView
            key="choose"
            onBuyerChoice={handleBuyerChoice}
            onProducerChoice={handleProducerChoice}
            onAffiliateChoice={handleAffiliateChoice}
          />
        )}
        {view === "already-has-account" && (
          <AlreadyHasAccountView
            key="already"
            onBack={handleBackToQuiz}
          />
        )}
        {view === "producer-form" && (
          <ProducerRegistrationForm
            key="form"
            registrationSource={registrationSource}
            onBack={handleBackToQuiz}
          />
        )}
      </AnimatePresence>
    </CadastroLayout>
  );
}
