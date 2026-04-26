import { SSMClient, SendCommandCommand, GetCommandInvocationCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({ region: process.env.EC2_REGION || 'us-west-2' });
const INSTANCE_ID = process.env.EC2_INSTANCE_ID;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const respond = (code, body) => ({ statusCode: code, headers, body: JSON.stringify(body) });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});
  if (!INSTANCE_ID) return respond(500, { message: 'EC2 instance not configured' });

  const { command } = JSON.parse(event.body || '{}');
  if (!command) return respond(400, { message: 'command required' });

  // Check bash history for the command, then run it and return output
  const checkScript = `
HIST_CMD=$(grep -F '${command.replace(/'/g, "'\\''")}' ~/.bash_history 2>/dev/null | tail -1)
if [ -n "$HIST_CMD" ]; then
  echo "FOUND_IN_HISTORY"
  ${command} 2>&1 | head -20
else
  echo "NOT_FOUND"
fi
`.trim();

  try {
    const send = await ssm.send(new SendCommandCommand({
      InstanceIds: [INSTANCE_ID],
      DocumentName: 'AWS-RunShellScript',
      Parameters: { commands: [checkScript] },
      TimeoutSeconds: 10,
    }));

    const commandId = send.Command.CommandId;

    // Poll for result
    for (let i = 0; i < 8; i++) {
      await sleep(800);
      try {
        const result = await ssm.send(new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: INSTANCE_ID,
        }));
        if (result.Status === 'Success') {
          const output = result.StandardOutputContent || '';
          if (output.startsWith('FOUND_IN_HISTORY')) {
            return respond(200, { passed: true, output: output.replace('FOUND_IN_HISTORY\n', '').trim() });
          }
          return respond(200, { passed: false, message: 'Command not found in your terminal history. Type it in the terminal first.' });
        }
        if (result.Status === 'Failed' || result.Status === 'Cancelled') {
          return respond(200, { passed: false, message: 'Verification check failed on the server.' });
        }
      } catch (e) {
        if (e.name !== 'InvocationDoesNotExist') throw e;
      }
    }
    return respond(200, { passed: false, message: 'Verification timed out. Try again.' });
  } catch (err) {
    console.error('SSM error:', err);
    return respond(500, { message: 'Verification unavailable', error: err.message });
  }
};
