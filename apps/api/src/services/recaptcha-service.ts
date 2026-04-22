import { AppError } from "../utils/app-error.js";

interface EnterpriseAssessmentResponse {
  tokenProperties?: {
    valid?: boolean;
    invalidReason?: string;
    action?: string;
  };
  riskAnalysis?: {
    score?: number;
    reasons?: string[];
  };
  name?: string;
}

const DEFAULT_MIN_SCORE = 0.5;

function getMinScore(): number {
  const value = Number.parseFloat(process.env.RECAPTCHA_MIN_SCORE || "");
  if (Number.isFinite(value) && value >= 0 && value <= 1) return value;
  return DEFAULT_MIN_SCORE;
}

export async function verifyRecaptchaToken(
  token: string,
  expectedAction: string,
  remoteIp?: string
): Promise<void> {
  const projectId = process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID;
  const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY;
  const siteKey = process.env.RECAPTCHA_ENTERPRISE_SITE_KEY;

  if (!projectId || !apiKey || !siteKey) {
    throw new AppError(
      500,
      "reCAPTCHA Enterprise is not fully configured",
      undefined,
      "recaptcha_not_configured"
    );
  }

  const verifyUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
  const payload: {
    event: {
      token: string;
      siteKey: string;
      expectedAction: string;
      userIpAddress?: string;
    };
  } = {
    event: {
      token,
      siteKey,
      expectedAction,
    },
  };
  if (remoteIp) payload.event.userIpAddress = remoteIp;

  let result: EnterpriseAssessmentResponse;
  try {
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Assessment request failed");
    }
    result = (await response.json()) as EnterpriseAssessmentResponse;
  } catch (error) {
    throw new AppError(
      502,
      "Failed to verify reCAPTCHA token",
      error instanceof Error ? error.message : "Unknown verification error",
      "recaptcha_verification_failed"
    );
  }

  const minScore = getMinScore();
  const valid = result.tokenProperties?.valid === true;
  const actionMatches = result.tokenProperties?.action === expectedAction;
  const score = result.riskAnalysis?.score;
  const scorePasses = typeof score === "number" ? score >= minScore : false;

  if (!valid || !actionMatches || !scorePasses) {
    throw new AppError(
      403,
      "reCAPTCHA verification failed",
      {
        valid,
        invalidReason: result.tokenProperties?.invalidReason,
        action: result.tokenProperties?.action,
        score,
        minScore,
        reasons: result.riskAnalysis?.reasons || [],
      },
      "recaptcha_verification_failed"
    );
  }
}
