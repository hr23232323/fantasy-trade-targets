import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [pushWorkflow, deployWorkflow, dataWorkflow, dockerignore] =
  await Promise.all([
    read("../../.github/workflows/deploy.yml"),
    read("../../.github/workflows/_deploy.yml"),
    read("../../.github/workflows/data-refresh.yml"),
    read("../.dockerignore"),
  ]);

test("push deploys never wait for upstream data refreshes", () => {
  assert.match(pushWorkflow, /Fast production deploy/);
  assert.doesNotMatch(pushWorkflow, /data:refresh|data:teams|schedule:/);
  assert.doesNotMatch(deployWorkflow, /data:refresh|data:teams/);
});

test("scheduled data publication owns refreshes and deploys changed releases", () => {
  assert.match(dataWorkflow, /schedule:/);
  assert.match(dataWorkflow, /npm run data:refresh/);
  assert.match(dataWorkflow, /npm run data:teams/);
  assert.match(dataWorkflow, /needs\.refresh\.outputs\.changed == 'true'/);
  assert.match(dataWorkflow, /uses: \.\/\.github\/workflows\/_deploy\.yml/);
});

test("production builds use remote layers and a bounded Docker context", () => {
  assert.match(deployWorkflow, /docker\/build-push-action@v7/);
  assert.match(deployWorkflow, /cache-from: type=gha/);
  assert.match(deployWorkflow, /cache-to: type=gha,mode=max/);
  assert.match(dockerignore, /^\.next$/m);
  assert.match(dockerignore, /^node_modules$/m);
  assert.match(dockerignore, /^tests$/m);
});
