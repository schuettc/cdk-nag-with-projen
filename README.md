# cdk-nag with Projen

[cdk-nag](https://github.com/cdklabs/cdk-nag) is a useful tool for enforcing best practices within a CDK stack. This can be combined with [jest](https://jestjs.io/) testing used in [projen](https://projen.io/) to ensure a compliant deployment.

## CDK Setup

After creating a basic projen project with something like `npx projen new awscdk-app-ts`, the `.projenrc.ts` file should be updated with `devDeps: ['cdk-nag']`. This will install `cdk-nag` as a [devDependency](https://docs.npmjs.com/specifying-dependencies-and-devdependencies-in-a-package-json-file).

Next, we will create a very basic CDK Stack:

```typescript
new Bucket(this, 'Bucket', {
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  encryption: BucketEncryption.S3_MANAGED,
});
```

## Test Setup

By default, projen will run tests using the files in the `test` folder. In this case, we have created a `cdk-nag.test.ts` file that will be run during deployment.

Let's set up that file. First, we'll set up the basics by importing the Stack that we will be deploying. In this case, we will import the `CDKNagWithProjen` Stack from `../src/cdk-nag-with-projen` and test against that.

```typescript
import { AwsSolutionsChecks } from 'cdk-nag';
import { CDKNagWithProjen } from '../src/cdk-nag-with-projen';

describe('cdk-nag AwsSolutions Pack', () => {
  let stack: Stack;
  let app: App;

  beforeEach(() => {
    app = new App();
    stack = new CDKNagWithProjen(app, 'CDKNagWithProjen', {});

    outputStream = fs.createWriteStream('cdk-nag-output.txt');
  });

  afterEach(() => {
    outputStream.end();
  });
  ...
});
```

## Test without Suppressions

First, we'll run tests against the Stack without suppressions and write the output to a file.

```typescript
import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks } from 'cdk-nag';

describe('cdk-nag AwsSolutions Pack', () => {
  ...
  test('Output all Warnings and Errors', () => {
    Aspects.of(stack).add(
      new AwsSolutionsChecks({
        verbose: true,
        logIgnores: false,
      }),
    );

    const warnings = Annotations.fromStack(stack).findWarning(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );

    outputStream.write('All Warnings:\n');
    warnings.forEach((warning) => {
      outputStream.write(warning.entry.data);
    });

    const errors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );

    outputStream.write('All Errors:\n');
    errors.forEach((error) => {
      outputStream.write(error.entry.data);
    });
  });
}
```

Each of these warnings and errors will be written to the `cdk-nag-output.txt` file. This will record the results of `cdk-nag` without any suppressions. In this example, the results will look like this:

```text
All Warnings:
All Errors:
AwsSolutions-S1: The S3 Bucket has server access logs disabled. The bucket should have server access logging enabled to provide detailed records for the requests that are made to the bucket.
AwsSolutions-S10: The S3 Bucket or bucket policy does not require requests to use SSL. You can use HTTPS (TLS) to help prevent potential attackers from eavesdropping on or manipulating network traffic using person-in-the-middle or similar attacks. You should allow only encrypted connections over HTTPS (TLS) using the aws:SecureTransport condition on Amazon S3 bucket policies.
AwsSolutions-S10: The S3 Bucket or bucket policy does not require requests to use SSL. You can use HTTPS (TLS) to help prevent potential attackers from eavesdropping on or manipulating network traffic using person-in-the-middle or similar attacks. You should allow only encrypted connections over HTTPS (TLS) using the aws:SecureTransport condition on Amazon S3 bucket policies.
```

This test has no expectations so will throw no errors when running `yarn projen test` or during deployment. The results of these tests are only written to the `cdk-nag-output.txt` file.

## Add suppressions

If these errors are acceptable, we can add a suppression to `cdk-nag`. To do this, we'll create `nagSuppressions.ts`.

```typescript
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
```

## Test with suppressions

Next, we'll run these tests again with suppressions.

```typescript
import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks } from 'cdk-nag';
import { applySuppressions } from '../src/nagSuppressions';


describe('cdk-nag AwsSolutions Pack', () => {
  ...

  test('No unsuppressed Warnings or Errors after applying suppressions', () => {
    applySuppressions(stack);

    Aspects.of(stack).add(
      new AwsSolutionsChecks({
        verbose: true,
        logIgnores: false,
      }),
    );

    const unsuppressedWarnings = Annotations.fromStack(stack).findWarning(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );

    expect(unsuppressedWarnings).toHaveLength(0);

    const unsuppressedErrors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );

    expect(unsuppressedErrors).toHaveLength(0);
  });
});
```

In this test, we are expecting `unsuppressedWarnings` and `unsuppressedErrors` to have a length of 0. If that is not the case, the tests will fail. If there are no warnings or errors, the result should look like this:

```text
$ npx projen test
👾 test | jest --passWithNoTests --updateSnapshot
 PASS  test/cdk-nag.test.ts
  cdk-nag AwsSolutions Pack
    ✓ Output all Warnings and Errors (220 ms)
    ✓ No unsuppressed Warnings or Errors after applying suppressions (51 ms)

------------------------|---------|----------|---------|---------|-------------------
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------------|---------|----------|---------|---------|-------------------
All files               |     100 |      100 |     100 |     100 |
 cdk-nag-with-projen.ts |     100 |      100 |     100 |     100 |
 nagSuppressions.ts     |     100 |      100 |     100 |     100 |
------------------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        2.756 s, estimated 3 s
Ran all test suites.
```

## Result

With a projen project configured CDK stack with this setup, we can perform `cdk-nag` tests on the Stack, capture the results, suppress acceptable warnings and errors, and then deploy confidently.
