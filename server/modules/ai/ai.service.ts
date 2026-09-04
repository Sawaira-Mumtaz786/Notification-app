import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export interface TriageResult {
  category: 'INFO' | 'WARNING' | 'ERROR';
  urgencyScore: number;
  refinedHeader: string;
  refinedBody: string;
  reasoning: string;
}

export interface RemediationResult {
  summary: string;
  probableRootCauses: string[];
  actionSteps: string[];
  recoveryPlaybook: string;
}

export interface SystemDigestResult {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  executiveSummary: string;
  criticalAlertsCount: number;
  warningCount: number;
  infoCount: number;
  keyInsights: string[];
  recommendedActions: string[];
}

export class AIService {
  /**
   * Triage and classify a notification using Gemini AI
   */
  async triage(header: string, body: string): Promise<TriageResult> {
    const ai = getGeminiClient();

    if (!ai) {
      // Heuristic fallback if Gemini API key is not configured
      return this.heuristicTriage(header, body);
    }

    try {
      const prompt = `You are a site reliability and DevOps incident classification expert.
Evaluate this notification and output STRICT JSON format:
Notification Header: "${header || 'Untitled'}"
Notification Body: "${body || ''}"

Return a JSON object with:
1. "category": exactly one of "ERROR", "WARNING", "INFO"
   - ERROR: System downtime, data loss, fatal exceptions, security breaches, broken service, 5xx errors.
   - WARNING: High memory/CPU, approaching quotas, latency spikes, deprecated API usage, non-blocking retries.
   - INFO: Successful deployments, routine scheduled maintenance notices, informational logs, releases.
2. "urgencyScore": integer from 1 to 10 (10 being catastrophic critical outage).
3. "refinedHeader": a concise, professional title (under 80 characters).
4. "refinedBody": clear, actionable, well-formatted description.
5. "reasoning": 1-2 sentence explanation of why this category and urgency were selected.

Only output valid JSON, no markdown code fence.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const raw = response.text ? response.text.trim() : '{}';
      const parsed = JSON.parse(raw);

      return {
        category: (parsed.category || 'INFO').toUpperCase() as 'INFO' | 'WARNING' | 'ERROR',
        urgencyScore: Number(parsed.urgencyScore) || 5,
        refinedHeader: parsed.refinedHeader || header || 'Incident Notification',
        refinedBody: parsed.refinedBody || body,
        reasoning: parsed.reasoning || 'Classified by automated AI triage engine.',
      };
    } catch (err) {
      console.warn('Gemini triage call failed, falling back to heuristic:', err);
      return this.heuristicTriage(header, body);
    }
  }

  /**
   * Draft a notification from a short prompt
   */
  async draftNotification(userPrompt: string): Promise<{ header: string; body: string; category: 'INFO' | 'WARNING' | 'ERROR'; urgencyScore: number }> {
    const ai = getGeminiClient();

    if (!ai) {
      return {
        header: userPrompt.slice(0, 50),
        body: `Details for: ${userPrompt}. Please investigate system components and confirm resolution.`,
        category: userPrompt.toLowerCase().includes('error') || userPrompt.toLowerCase().includes('down') ? 'ERROR' : 'WARNING',
        urgencyScore: 6,
      };
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create a professional notification alert based on this brief prompt: "${userPrompt}".
Output JSON:
{
  "header": "string under 80 chars",
  "body": "detailed informative paragraph under 250 words",
  "category": "ERROR" | "WARNING" | "INFO",
  "urgencyScore": integer 1-10
}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        header: parsed.header || userPrompt.slice(0, 60),
        body: parsed.body || userPrompt,
        category: (parsed.category || 'WARNING').toUpperCase() as any,
        urgencyScore: parsed.urgencyScore || 5,
      };
    } catch {
      return {
        header: userPrompt.slice(0, 50),
        body: `Automated alert for: ${userPrompt}`,
        category: 'INFO',
        urgencyScore: 3,
      };
    }
  }

  /**
   * Generate remediation steps and playbook for an alert
   */
  async generateRemediation(header: string, body: string, category: string): Promise<RemediationResult> {
    const ai = getGeminiClient();

    if (!ai) {
      return {
        summary: `Standard triage required for [${category}] ${header}`,
        probableRootCauses: [
          'Resource exhaustion or spike in client traffic',
          'Network partition or timeout reaching downstream dependency',
          'Configuration mismatch following recent deployment',
        ],
        actionSteps: [
          'Inspect application and container logs for fatal stack traces',
          'Verify connectivity to backend databases and caches',
          'Roll back latest service version if issue started after deployment',
        ],
        recoveryPlaybook: '1. Isolate failing node -> 2. Check health metrics -> 3. Restart process or scale pods.',
      };
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are a Principal DevOps and SRE Engineer.
Analyze this alert and provide an immediate incident remediation guide:
Category: ${category}
Header: ${header}
Body: ${body}

Output JSON with:
1. "summary": brief diagnostic assessment (1-2 sentences)
2. "probableRootCauses": array of 2-3 most likely root causes
3. "actionSteps": array of 3-4 concrete immediate triage commands or verification steps
4. "recoveryPlaybook": concise mitigation strategy or rollback advice`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        summary: parsed.summary || `Remediation guide for ${header}`,
        probableRootCauses: Array.isArray(parsed.probableRootCauses) ? parsed.probableRootCauses : ['Investigate logs'],
        actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : ['Verify service health'],
        recoveryPlaybook: parsed.recoveryPlaybook || 'Execute standard runbook procedures.',
      };
    } catch {
      return {
        summary: `Remediation guide for ${header}`,
        probableRootCauses: ['Service communication failure', 'Configuration error'],
        actionSteps: ['Check live logs', 'Verify environmental secrets'],
        recoveryPlaybook: 'Follow standard team on-call response guidelines.',
      };
    }
  }

  /**
   * Generate system health summary and executive digest across all user notifications
   */
  async generateDigest(notifications: Array<{ header: string; body: string; category: string; createdAt: string }>): Promise<SystemDigestResult> {
    const errors = notifications.filter(n => n.category === 'ERROR').length;
    const warnings = notifications.filter(n => n.category === 'WARNING').length;
    const infos = notifications.filter(n => n.category === 'INFO').length;

    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (errors > 0) {
      overallStatus = 'CRITICAL';
    } else if (warnings > 0) {
      overallStatus = 'DEGRADED';
    }

    const ai = getGeminiClient();
    if (!ai || notifications.length === 0) {
      return {
        status: overallStatus,
        executiveSummary: notifications.length === 0
          ? 'All systems are operating normally. No active notifications or incidents reported.'
          : `Active system alerts: ${errors} error(s), ${warnings} warning(s), and ${infos} info item(s).`,
        criticalAlertsCount: errors,
        warningCount: warnings,
        infoCount: infos,
        keyInsights: [
          errors > 0 ? `${errors} critical error(s) requiring immediate engineer triage.` : 'No critical incidents detected.',
          warnings > 0 ? `${warnings} warning(s) indicating potential system degradation.` : 'Warning threshold within acceptable limits.',
        ],
        recommendedActions: [
          errors > 0 ? 'Prioritize red ERROR alerts first before attending to warnings.' : 'Review informational logs and monitor uptime.',
          'Acknowledge or dismiss resolved banners to keep dashboard clean.',
        ],
      };
    }

    try {
      const summaryPayload = notifications.slice(0, 15).map(n => ({
        category: n.category,
        header: n.header,
        body: n.body.slice(0, 120),
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Analyze these recent notifications:
${JSON.stringify(summaryPayload)}

Output JSON:
{
  "status": "HEALTHY" | "DEGRADED" | "CRITICAL",
  "executiveSummary": "Concise executive overview of system health (2 sentences)",
  "keyInsights": ["2-3 bullet point observations"],
  "recommendedActions": ["2-3 actionable next steps for the engineering team"]
}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        status: parsed.status || overallStatus,
        executiveSummary: parsed.executiveSummary || `System status is ${overallStatus.toLowerCase()} with ${errors} critical alert(s).`,
        criticalAlertsCount: errors,
        warningCount: warnings,
        infoCount: infos,
        keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : ['Review active warnings'],
        recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : ['Address critical notifications'],
      };
    } catch {
      return {
        status: overallStatus,
        executiveSummary: `System monitoring overview: ${errors} critical errors, ${warnings} warnings.`,
        criticalAlertsCount: errors,
        warningCount: warnings,
        infoCount: infos,
        keyInsights: ['Active alerts present in queue'],
        recommendedActions: ['Review dashboard and address urgent issues'],
      };
    }
  }

  private heuristicTriage(header: string, body: string): TriageResult {
    const combined = `${header} ${body}`.toLowerCase();

    let category: 'INFO' | 'WARNING' | 'ERROR' = 'INFO';
    let urgencyScore = 3;

    if (
      combined.includes('fatal') ||
      combined.includes('down') ||
      combined.includes('outage') ||
      combined.includes('crash') ||
      combined.includes('broken') ||
      combined.includes('failed') ||
      combined.includes('exception') ||
      combined.includes('500') ||
      combined.includes('504') ||
      combined.includes('corrupted')
    ) {
      category = 'ERROR';
      urgencyScore = 9;
    } else if (
      combined.includes('warn') ||
      combined.includes('slow') ||
      combined.includes('latency') ||
      combined.includes('spike') ||
      combined.includes('retry') ||
      combined.includes('quota') ||
      combined.includes('high memory') ||
      combined.includes('high cpu')
    ) {
      category = 'WARNING';
      urgencyScore = 6;
    }

    return {
      category,
      urgencyScore,
      refinedHeader: header || 'Notification',
      refinedBody: body,
      reasoning: `Rule-based triage detected keywords corresponding to ${category} severity.`,
    };
  }
}

export const aiService = new AIService();
