import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as path from "path";
import { Links } from "./links";

async function run(): Promise<void> {
    try {
        // Add the CLI to the environment path.
        const cliPath = path.normalize(`${__dirname}\\..\\node_modules\\@vsintellicode\\cli\\CLI`);
        core.addPath(cliPath);

        // Retrieve the PAT Token and the github workspace.
        // Get required input arguments.
        let patToken: string = "";
        try {
            // When 'required' is sent as true, git/core will
            // throw when the argument is not found.
            patToken = core.getInput("pat", { required: true });

            // If the retrieved pat is an empty string, we throw to print the warning end return.
            if (!patToken) {
                throw Error;
            }
        } catch (error) {
            core.warning(
                `Could not find personal access token (PAT) in configuration. Please provide one as a step argument. For instructions on getting a PAT visit ${Links.PAT_TOKEN}`,
            );
            return;
        }

        let directory = process.env.GITHUB_WORKSPACE;
        const overrideDirectory = core.getInput("directory");

        // Null comparison in typescript is similar to IsNullOrWhiteSpace in C#.
        if(overrideDirectory != null){
            // If directory was overriden, we override that variable.
            directory = overrideDirectory;
        }

        // Validate directory
        if (directory == null) {
            // If the environment variable is not set, this could mean that the
            // github action is running on a different environment other than
            // the one github provides.
            throw Error("A workspace directory was not found in the current CI environment.");
        } else {
            if (!fs.existsSync(directory)) {
                // If the workspace directory doesn't exists we can't train anything.
                // An error is thrown to notice the reason of failure.
                throw Error("Workspace directory doesn't exists in the file system.");
            }
        }


        

        const args = [
            "train",
            "--directory",
            directory,
            "--pat-token",
            patToken,
            "--verbosity",
            "n", // Verbosity level.
        ];

        const config = core.getInput("config");
        const platform = core.getInput("platform");


        // Setting process to be CI for multiple core usage.
        process.env.CPP_EXTRACT_MODE = "CI";

        if (config && platform) {
            args.push("--configuration", config, "--platform", platform);
        }

        // Execute the CLI with the given arguments.
        exec.exec("intellicode.exe", args);
    } catch (error) {
        // If an unhandled exception is thrown
        // an error message is logged.
        // This allows the pipeline to continue and also notifies
        // the user that something went wrong on the intellicode model training.
        core.error(error.message);
    }
}

run();
