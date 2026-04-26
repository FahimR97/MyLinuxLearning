import { SSMClient, SendCommandCommand, GetCommandInvocationCommand } from '@aws-sdk/client-ssm';
import { readFileSync } from 'fs';
import { join } from 'path';

const ssm = new SSMClient({ region: process.env.EC2_REGION || 'us-west-2' });
const INSTANCE_ID = process.env.EC2_INSTANCE_ID;

const labs = JSON.parse(readFileSync(join(process.env.LAMBDA_TASK_ROOT || '.', 'content', 'labs.json'), 'utf-8'));

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const respond = (code, body) => ({ statusCode: code, headers, body: JSON.stringify(body) });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});
  if (!INSTANCE_ID) return respond(500, { message: 'Verification unavailable' });

  const { labId, stepIndex } = JSON.parse(event.body || '{}');
  if (!labId || stepIndex == null) return respond(400, { message: 'labId and stepIndex required' });
  if (typeof stepIndex !== 'number' || stepIndex < 0 || stepIndex > 50) return respond(400, { message: 'Invalid stepIndex' });
  if (typeof labId !== 'string' || !/^[a-zA-Z0-9-]+$/.test(labId)) return respond(400, { message: 'Invalid labId' });

  // Server-side lookup — never trust client-supplied commands
  const lab = labs.find(l => l.id === labId);
  if (!lab) return respond(404, { message: 'Lab not found' });
  const step = lab.steps?.[stepIndex];
  if (!step) return respond(404, { message: 'Step not found' });

  const command = step.command;

  // Only check history — never execute the command
  const safeCmd = command.replace(/'/g, "'\\''");
  const checkScript = `grep -F '${safeCmd}' ~/.bash_history 2>/dev/null | tail -1`;

  try {
    const send = await ssm.send(new SendCommandCommand({
      InstanceIds: [INSTANCE_ID],
      DocumentName: 'AWS-RunShellScript',
      Parameters: { commands: [checkScript] },
      TimeoutSeconds: 10,
    }));

    const commandId = send.Command.CommandId;
    for (let i = 0; i < 8; i++) {
      await sleep(800);
      try {
        const result = await ssm.send(new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: INSTANCE_ID,
        }));
        if (result.Status === 'Success') {
          const output = (result.StandardOutputContent || '').trim();
          if (output) {
            return respond(200, { passed: true, output: step.expectedOutput || 'Command verified.' });
          }
          return respond(200, { passed: false, message: 'Command not found in your terminal history. Type it in the terminal first.' });
        }
        if (result.Status === 'Failed' || result.Status === 'Cancelled') {
          return respond(200, { passed: false, message: 'Verification check failed.' });
        }
      } catch (e) {
        if (e.name !== 'InvocationDoesNotExist') throw e;
      }
    }
    return respond(200, { passed: false, message: 'Verification timed out. Try again.' });
  } catch (err) {
    console.error('SSM error:', err);
    return respond(500, { message: 'Verification unavailable' });
  }
};
