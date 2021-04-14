const gulp = require("gulp");
const del = require("del");
const mocha = require("gulp-mocha");
const emu = require("gulp-emu");
const rename = require("gulp-rename");
const gls = require("gulp-live-server");
const { spawn } = require("child_process");
const path = require("path");

let configuration = "debug";

gulp.task("release", async () => { configuration = "release"; });
gulp.task("clean", () => del([
    "Reflect.js",
    "Reflect.js.map",
    "no-conflict.js",
    "no-conflict.js.map",
    "test/**/*.js",
    "test/**/*.js.map",
    "!test/no-conflict.js",
    "!test/reflect.js",
]));

gulp.task("build:reflect", () => exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", configuration === "debug" ? "./tsconfig.json" : "./tsconfig-release.json"]));
gulp.task("build:tests", () => exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "test/tsconfig.json"]));
gulp.task("build:spec", () => gulp
    .src(["spec.html"])
    .pipe(emu({ js: "ecmarkup.js", css: "ecmarkup.css", biblio: true }))
    .pipe(rename(path => {
        if (path.basename === "spec" && path.extname === ".html") {
            path.basename = "index";
        }
    }))
    .pipe(gulp.dest("docs")));

gulp.task("build", gulp.series("build:reflect", "build:tests", "build:spec"));

gulp.task("test", gulp.series("build:reflect", "build:tests",
    Object.assign(() => {
        return gulp
            .src(["test/import.js", "test/global.js"], { read: false })
            .pipe(mocha({ reporter: "dot", parallel: true }));
    }, { displayName: "run:tests" })));

gulp.task("watch:reflect", () => gulp.watch(["Reflect.ts", "no-conflict.ts", "tsconfig.json", "test/**/*.ts", "test/**/tsconfig.json"], gulp.task("test")));
gulp.task("watch:spec", () => gulp.watch(["spec.html"], gulp.task("build:spec")));
gulp.task("watch", gulp.series("watch:reflect", "watch:spec", () => {
    const server = gls.static("docs", 8080);
    const promise = server.start();
    gulp.watch(["docs/**/*"]).on("change", file => {
        server.notify({ path: path.resolve(file) });
    });
    return promise;
}));

gulp.task("prepublish", gulp.series("release", "clean", "test"));
gulp.task("reflect", gulp.task("build:reflect"));
gulp.task("tests", gulp.task("build:tests"));
gulp.task("spec", gulp.task("build:spec"));
gulp.task("start", gulp.task("watch"));
gulp.task("default", gulp.series("build", "test"));

function exec(cmd, args = [], { ignoreExitCode = false, cwd } = {}) {
    return new Promise((resolve, reject) => {
        const isWindows = /^win/.test(process.platform);
        const shell = isWindows ? "cmd" : "/bin/sh";
        const shellArgs = isWindows ? ["/c", cmd.includes(" ") >= 0 ? `"${cmd}"` : cmd, ...args] : ["-c", `${cmd} ${args.join(" ")}`];
        const child = spawn(shell, shellArgs, { stdio: "inherit", cwd, windowsVerbatimArguments: true });
        child.on("exit", exitCode => {
            child.removeAllListeners();
            if (exitCode === 0 || ignoreExitCode) {
                resolve({ exitCode });
            }
            else {
                reject(new Error(`Process exited with code: ${exitCode}`));
            }
        });
        child.on("error", error => {
            child.removeAllListeners();
            reject(error);
        });
    });
}