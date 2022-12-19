import { spawn } from "child_process";
import { setOutput, setFailed } from "@actions/core";
function getFilesDiff() {
    return new Promise((resolve, reject) => {
        const child = spawn("git", ["diff", "--name-only", "HEAD~1"]);
        const files = [];
        child.on("error", (error) => {
            console.log(error);
            reject(error);
        });
        child.stdout.on("data", (data) => {
            files.push(...data
                .toString()
                .trim()
                .split("\n")
                .filter((fileName) => fileName !== ""));
        });
        child.on("exit", (code) => {
            if (code === 0) {
                resolve(files);
            }
            else {
                reject();
            }
        });
    });
}
const dirs = {
    "puppeteer-core": ["packages/puppeteer-core/"],
    puppeteer: ["packages/puppeteer/", "test/", "docker/", "versions.js"],
    "ng-schematics": ["packages/ng-schematics"],
    website: ["website/", "docs/"],
    github: [".github/"],
    public: ["public"],
};
async function main() {
    const changesSet = new Set();
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
    for (const key in dirs) {
        setOutput(key, changesSet.has(key));
    }
}
main().catch((error) => {
    setFailed(error);
});
