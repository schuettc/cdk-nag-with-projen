import { App, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class CDKNagWithProjen extends Stack {
  constructor(scope: Construct, id: string, _props: StackProps) {
    super(scope, id);

    new Bucket(this, 'Bucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: BucketEncryption.S3_MANAGED,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new CDKNagWithProjen(app, 'CDKNagWithProjen', {
  env: devEnv,
});

app.synth();
