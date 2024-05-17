const { awscdk } = require('projen');
const { JobPermission } = require('projen/lib/github/workflows-model');
const { UpgradeDependenciesSchedule } = require('projen/lib/javascript');
const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.141.0',
  defaultReleaseBranch: 'main',
  name: 'cdk-nag-with-projen',
  appEntrypoint: 'cdk-nag-with-projen.ts',
  license: 'MIT-0',
  author: 'Court Schuett',
  copyrightOwner: 'Court Schuett',
  authorAddress: 'https://subaud.io',
  devDeps: ['cdk-nag'],
  projenrcTs: true,
  deps: [],
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['schuettc'],
  },
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      schedule: UpgradeDependenciesSchedule.WEEKLY,
    },
  },
});

project.tsconfigDev.file.addOverride('include', [
  'test/*.ts',
  'src/**/*.ts',
  './.projenrc.ts',
]);

project.eslint.addOverride({
  files: ['src/*.ts', 'test/*.ts'],
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
    'import/no-extraneous-dependencies': 'off',
  },
});

const common_exclude = [
  'docker-compose.yaml',
  'cdk.out',
  'cdk.context.json',
  'yarn-error.log',
  'dependabot.yml',
  '.DS_Store',
  '.env',
  '**/dist/**',
  'config.json',
  'cdk-nag-output.txt',
];

project.gitignore.exclude(...common_exclude);
project.synth();
