/**
 * members-area-quizzes - Gerenciamento de quizzes
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliance (Zero any)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiter.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// Use public CORS for members area
const corsHeaders = PUBLIC_CORS_HEADERS;

// === INTERFACES (Zero any) ===

interface AnswerInput {
  id?: string;
  answer_text: string;
  is_correct: boolean;
  position: number;
}

interface QuestionInput {
  id?: string;
  question_text: string;
  question_type: string;
  points: number;
  position: number;
  answers: AnswerInput[];
}

interface QuizRequestData {
  title?: string;
  description?: string;
  passing_score?: number;
  max_attempts?: number;
  time_limit_seconds?: number;
  questions?: QuestionInput[];
  answers?: Record<string, string>;
}

interface QuizRequest {
  action: "list" | "get" | "create" | "update" | "delete" | "submit" | "get-attempts";
  content_id?: string;
  quiz_id?: string;
  buyer_token?: string;
  data?: QuizRequestData;
}

interface AnswerRecord {
  id: string;
  is_correct: boolean;
}

interface QuestionRecord {
  id: string;
  points: number;
  answers: AnswerRecord[];
}

interface QuizData {
  id: string;
  passing_score: number | null;
  max_attempts: number | null;
  questions: QuestionRecord[];
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  buyer_id: string;
  answers: Record<string, string>;
  score: number;
  total_points: number;
  passed: boolean;
  started_at: string;
  completed_at: string;
}

interface BuyerSession {
  buyer_id: string;
  expires_at: string;
  is_valid: boolean;
}

interface QuizRecord {
  id: string;
  content_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number | null;
  time_limit_seconds: number | null;
  is_active: boolean;
  created_at: string;
}

interface QuizWithQuestions extends QuizRecord {
  questions: Array<{
    id: string;
    position: number;
    answers: Array<{ position: number }>;
  }>;
}

interface QuestionCreated {
  id: string;
}

// === HELPER FUNCTIONS ===

async function handleQuizSubmit(
  supabase: SupabaseClient,
  quiz_id: string,
  buyer_id: string,
  answers: Record<string, string>
): Promise<Response> {
  // Buscar quiz com questions e answers corretas
  const { data: quizData, error: quizError } = await supabase
    .from("quizzes")
    .select(`
      id,
      passing_score,
      max_attempts,
      questions:quiz_questions(
        id,
        points,
        answers:quiz_answers(id, is_correct)
      )
    `)
    .eq("id", quiz_id)
    .single() as { data: QuizData | null; error: Error | null };

  if (quizError || !quizData) {
    return new Response(
      JSON.stringify({ error: "Quiz not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const quiz = quizData;

  // Verificar limite de tentativas
  if (quiz.max_attempts) {
    const { count } = await supabase
      .from("buyer_quiz_attempts")
      .select("id", { count: "exact" })
      .eq("quiz_id", quiz_id)
      .eq("buyer_id", buyer_id);

    if (count && count >= quiz.max_attempts) {
      return new Response(
        JSON.stringify({ error: "Maximum attempts reached" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Calcular pontuação
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const question of quiz.questions || []) {
    totalPoints += question.points;
    const submittedAnswer = answers[question.id];
    
    if (submittedAnswer) {
      const correctAnswer = question.answers?.find((a) => a.is_correct);
      if (correctAnswer && correctAnswer.id === submittedAnswer) {
        earnedPoints += question.points;
      }
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= (quiz.passing_score || 70);

  // Salvar tentativa
  const { data: attempt, error: attemptError } = await supabase
    .from("buyer_quiz_attempts")
    .insert({
      quiz_id,
      buyer_id,
      answers,
      score,
      total_points: earnedPoints,
      passed,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select()
    .single() as { data: QuizAttempt | null; error: Error | null };

  if (attemptError) throw attemptError;

  console.log(`[members-area-quizzes] Quiz ${quiz_id} submitted by buyer ${buyer_id}: ${score}% (${passed ? "PASSED" : "FAILED"})`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      result: {
        score,
        passed,
        earned_points: earnedPoints,
        total_points: totalPoints,
        attempt_id: attempt?.id,
      }
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetAttempts(
  supabase: SupabaseClient,
  quiz_id: string,
  buyer_id: string
): Promise<Response> {
  const { data: attempts, error } = await supabase
    .from("buyer_quiz_attempts")
    .select("*")
    .eq("quiz_id", quiz_id)
    .eq("buyer_id", buyer_id)
    .order("completed_at", { ascending: false }) as { data: QuizAttempt[] | null; error: Error | null };

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, attempts }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// === MAIN HANDLER ===

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      RATE_LIMIT_CONFIGS.MEMBERS_AREA
    );
    if (rateLimitResult) {
      console.warn(`[members-area-quizzes] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const body: QuizRequest = await req.json();
    const { action, content_id, quiz_id, buyer_token, data } = body;

    console.log(`[members-area-quizzes] Action: ${action}`);

    // Para ações de buyer (submit, get-attempts), validar buyer token
    if (action === "submit" || action === "get-attempts") {
      if (!buyer_token) {
        return new Response(
          JSON.stringify({ error: "buyer_token required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: session } = await supabase
        .from("buyer_sessions")
        .select("buyer_id, expires_at, is_valid")
        .eq("session_token", buyer_token)
        .single() as { data: BuyerSession | null };

      if (!session || !session.is_valid || new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const buyer_id = session.buyer_id;

      if (action === "submit") {
        return handleQuizSubmit(supabase, quiz_id!, buyer_id, data?.answers || {});
      }

      if (action === "get-attempts") {
        return handleGetAttempts(supabase, quiz_id!, buyer_id);
      }
    }

    // Para ações de vendedor, autenticar via unified-auth
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    switch (action) {
      case "list": {
        if (!content_id) {
          return new Response(
            JSON.stringify({ error: "content_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: quizzes, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("content_id", content_id)
          .order("created_at", { ascending: true }) as { data: QuizRecord[] | null; error: Error | null };

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, quizzes }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get": {
        if (!quiz_id) {
          return new Response(
            JSON.stringify({ error: "quiz_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: quiz, error } = await supabase
          .from("quizzes")
          .select(`
            *,
            questions:quiz_questions(
              *,
              answers:quiz_answers(*)
            )
          `)
          .eq("id", quiz_id)
          .single() as { data: QuizWithQuestions | null; error: Error | null };

        if (error) throw error;

        // Ordenar questions e answers
        if (quiz?.questions) {
          quiz.questions.sort((a, b) => a.position - b.position);
          quiz.questions.forEach((q) => {
            if (q.answers) {
              q.answers.sort((a, b) => a.position - b.position);
            }
          });
        }

        return new Response(
          JSON.stringify({ success: true, quiz }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        if (!content_id || !data?.title) {
          return new Response(
            JSON.stringify({ error: "content_id and title required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Criar quiz
        const { data: quiz, error: quizError } = await supabase
          .from("quizzes")
          .insert({
            content_id,
            title: data.title,
            description: data.description || null,
            passing_score: data.passing_score || 70,
            max_attempts: data.max_attempts || null,
            time_limit_seconds: data.time_limit_seconds || null,
            is_active: true,
          })
          .select()
          .single() as { data: QuizRecord | null; error: Error | null };

        if (quizError) throw quizError;

        // Criar questions e answers se fornecidos
        if (data.questions?.length && quiz) {
          for (const q of data.questions) {
            const { data: question, error: questionError } = await supabase
              .from("quiz_questions")
              .insert({
                quiz_id: quiz.id,
                question_text: q.question_text,
                question_type: q.question_type || "multiple_choice",
                points: q.points || 1,
                position: q.position,
              })
              .select()
              .single() as { data: QuestionCreated | null; error: Error | null };

            if (questionError) throw questionError;

            if (q.answers?.length && question) {
              const answersToInsert = q.answers.map(a => ({
                question_id: question.id,
                answer_text: a.answer_text,
                is_correct: a.is_correct,
                position: a.position,
              }));

              const { error: answersError } = await supabase
                .from("quiz_answers")
                .insert(answersToInsert);

              if (answersError) throw answersError;
            }
          }
        }

        console.log(`[members-area-quizzes] Created quiz: ${quiz?.id}`);

        return new Response(
          JSON.stringify({ success: true, quiz }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!quiz_id || !data) {
          return new Response(
            JSON.stringify({ error: "quiz_id and data required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.passing_score !== undefined) updateData.passing_score = data.passing_score;
        if (data.max_attempts !== undefined) updateData.max_attempts = data.max_attempts;
        if (data.time_limit_seconds !== undefined) updateData.time_limit_seconds = data.time_limit_seconds;

        const { error } = await supabase
          .from("quizzes")
          .update(updateData)
          .eq("id", quiz_id);

        if (error) throw error;

        // Atualizar questions se fornecidas
        if (data.questions?.length) {
          // Deletar questions existentes
          await supabase.from("quiz_questions").delete().eq("quiz_id", quiz_id);

          // Inserir novas
          for (const q of data.questions) {
            const { data: question, error: questionError } = await supabase
              .from("quiz_questions")
              .insert({
                quiz_id,
                question_text: q.question_text,
                question_type: q.question_type || "multiple_choice",
                points: q.points || 1,
                position: q.position,
              })
              .select()
              .single() as { data: QuestionCreated | null; error: Error | null };

            if (questionError) throw questionError;

            if (q.answers?.length && question) {
              const answersToInsert = q.answers.map(a => ({
                question_id: question.id,
                answer_text: a.answer_text,
                is_correct: a.is_correct,
                position: a.position,
              }));

              await supabase.from("quiz_answers").insert(answersToInsert);
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!quiz_id) {
          return new Response(
            JSON.stringify({ error: "quiz_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("quizzes")
          .delete()
          .eq("id", quiz_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("[members-area-quizzes] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
