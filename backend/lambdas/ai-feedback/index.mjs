import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'eu-west-2' });
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const respond = (code, body) => ({ statusCode: code, headers, body: JSON.stringify(body) });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});

  const { scenario, history, userInput } = JSON.parse(event.body || '{}');
  if (!scenario || !userInput) return respond(400, { message: 'scenario and userInput required' });

  // Input validation
  if (!scenario.title || !scenario.description || !Array.isArray(scenario.steps)) return respond(400, { message: 'Invalid scenario' });
  if (!Array.isArray(history) || history.length > 50) return respond(400, { message: 'Invalid history' });
  if (!userInput.text || typeof userInput.text !== 'string') return respond(400, { message: 'Invalid userInput' });
  const text = userInput.text.slice(0, 500);

  const prompt = `You are a senior Linux systems engineer mentoring someone preparing for an L4 Systems Development Engineer interview at AWS. They are working through a troubleshooting scenario.

SCENARIO: ${scenario.title}
CONTEXT: ${scenario.description}

The ideal diagnostic steps for this scenario are:
${scenario.steps.slice(0, 20).map((s, i) => `${i + 1}. ${s.action} (commands: ${s.commands.join(', ')})`).join('\n')}

The candidate's history so far:
${history.length > 0 ? history.slice(-20).map(h => `- They ${h.type === 'command' ? 'ran: ' + h.text?.slice(0, 200) : 'said: ' + h.text?.slice(0, 200)}`).join('\n') : '(No actions taken yet)'}

Current step they should be on: step ${(history.filter(h => h.matched).length) + 1} of ${scenario.steps.length}

The candidate just ${userInput.type === 'command' ? 'typed this command: ' + text : 'shared this thinking: ' + text}

Respond as a mentor. Be concise (2-4 sentences max). If they typed a command:
- If it matches or is close to the current expected step, confirm it's good and explain what the output means. Show the simulated output.
- If it matches a later step, tell them they're jumping ahead and hint at what to check first.
- If it's wrong, explain why it's not the best next step and give a gentle hint.

If they shared their thinking:
- Validate good reasoning, correct misconceptions, and guide them toward the next diagnostic step.

Keep the tone encouraging but direct. Use technical language appropriate for an L4 SysDE interview.`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  try {
    const response = await client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    const feedback = result.content[0].text;

    const currentStepIdx = history.filter(h => h.matched).length;
    let matched = false;
    let matchedStep = null;
    let output = null;

    if (userInput.type === 'command') {
      const normalised = text.trim().toLowerCase().replace(/\s+/g, ' ');
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        for (const cmd of step.commands) {
          if (normalised.includes(cmd.toLowerCase()) || cmd.toLowerCase().includes(normalised)) {
            if (i === currentStepIdx) {
              matched = true;
              matchedStep = i;
              output = step.output;
            } else if (i > currentStepIdx) {
              matchedStep = i;
            }
            break;
          }
        }
        if (matched) break;
      }
    }

    return respond(200, { feedback, matched, matchedStep, output });
  } catch (err) {
    console.error('Bedrock error:', err);
    return respond(500, { message: 'AI feedback unavailable' });
  }
};
