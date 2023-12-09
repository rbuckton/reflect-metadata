const gulp = require("gulp");
const sequence = require("gulp-sequence");
const del = require("del");
const tsb = require("gulp-tsb");
const mocha = require("gulp-mocha");
const emu = require("gulp-emu");
const rename = require("gulp-rename");
const gls = require("gulp-live-server");

const debugProject = tsb.create("tsconfig.json");
const releaseProject = tsb.create("tsconfig-release.json");
const tests = tsb.create("test/tsconfig.json");

let project = debugProject;

gulp.task("release", () => { project = releaseProject; });
gulp.task("clean", () => del([
    "Reflect.js",
    "Reflect.js.map",
    "ReflectLite.js",
    "ReflectLite.js.map",
    "ReflectNoConflict.js",
    "ReflectNoConflict.js.map",
    "test/**/*.js",
    "test/**/*.js.map"
]));

gulp.task("build:reflect", () => gulp
    .src(["globals.d.ts", "Reflect.ts", "ReflectLite.ts", "ReflectNoConflict.ts"])
    .pipe(project())
    .pipe(gulp.dest(".")));

gulp.task("build:tests", () => gulp
    .src(["test/**/*.ts"])
    .pipe(tests())
    .pipe(gulp.dest("test")));

gulp.task("build:spec", () => gulp
    .src(["spec.html"])
    .pipe(emu({ js: "ecmarkup.js", css: "ecmarkup.css", biblio: true }))
    .pipe(rename(path => {
        if (path.basename === "spec" && path.extname === ".html") {
            path.basename = "index";
        }
    }))
    .pipe(gulp.dest("docs")));

gulp.task("build", ["build:reflect", "build:tests", "build:spec"]);

gulp.task("test", ["build:reflect", "build:tests"], () => {
    console.log("Running tests...");
    return gulp
        .src(["test/**/*.js"], { read: false })
        .pipe(mocha({ reporter: "dot" }));
});

gulp.task("watch:reflect", () => gulp.watch([
    "index.d.ts",
    "no-conflict.d.ts",
    "globals.d.ts",
    "Reflect.ts",
    "ReflectLite.ts",
    "ReflectNoConflict.ts",
    "tsconfig.json",
    "test/**/*.ts",
    "test/**/tsconfig.json"
], ["test"]));
gulp.task("watch:spec", () => gulp.watch(["spec.html"], ["build:spec"]));
gulp.task("watch", ["watch:reflect", "watch:spec"], () => {
    const server = gls.static("docs", 8080);
    const promise = server.start();
    gulp.watch(["docs/**/*"], file => server.notify(file));
    return promise;
});

gulp.task("prepublish", sequence("release", "clean", "test"));
gulp.task("reflect", ["build:reflect"]);
gulp.task("tests", ["build:tests"]);
gulp.task("spec", ["build:spec"]);
gulp.task("start", ["watch"]);
gulp.task("default", ["build", "test"]);
