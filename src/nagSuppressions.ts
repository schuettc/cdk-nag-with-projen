import { Stack } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export function applySuppressions(stack: Stack): void {
  NagSuppressions.addStackSuppressions(stack, [
    {
      id: 'AwsSolutions-S1',
      reason: 'Suppressing S3 server access logging warning for demo purposes',
    },
    {
      id: 'AwsSolutions-S10',
      reason: 'Suppressing S3 bucket SSL requirement warning for demo purposes',
    },
  ]);
}
