import { spawn } from "child_process";
import { setOutput, setFailed } from "@actions/core";

function getFilesDiff(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["diff", "--name-only", "HEAD~1"]);
    const files: string[] = [];

    child.on("error", (error) => {
      console.log(error);
      reject(error);
    });

    child.stdout.on("data", (data) => {
      files.push(
        ...data
          .toString()
          .trim()
          .split("\n")
          .filter((fileName: string) => fileName !== "")
      );
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(files);
      } else {
        reject();
      }
    });
  });
}

const dirs: Record<string, string[]> = {
  "puppeteer-core": ["packages/puppeteer-core/"],
  puppeteer: ["packages/puppeteer/", "test/", "docker/", "versions.js"],
  "ng-schematics": ["packages/ng-schematics"],
  website: ["website/", "docs/"],
  github: [".github/"],
  public: ["public"],
};

async function main() {
  const changesSet = new Set<string>();
  const files = await getFilesDiff();

  for (const file of files) {
    for (const dir in dirs) {
      if (!changesSet.has(dir)) {
        for (const path of dirs[dir]) {
          if (file.startsWith(path)) {
            changesSet.add(dir);
            break;
          }
        }
      }
    }
  }

  // Use a string rather then individual export as we can't easily remap
  // from step output to job output
  let changesString = "";
  let changesArray = [];
  for (const key in dirs) {
    if (changesSet.has(key)) {
      // Add a delimiter for easier debugging
      changesString += `${key}+`;
      changesArray.push(key);
    }
  }

  setOutput("packages", changesString);

  setOutput("packagesArray", changesArray);
}

main().catch((error) => {
  setFailed(error);
});
