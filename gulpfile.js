const gulp = require("gulp");
const sequence = require("gulp-sequence");
const del = require("del");
const tsb = require("gulp-tsb");
const mocha = require("gulp-mocha");
const emu = require("gulp-emu");
const rename = require("gulp-rename");
const gls = require("gulp-live-server");
const spawn = require("child_process").spawn;

const project = tsb.create("tsconfig.json");
const tests = tsb.create("test/tsconfig.json");

gulp.task("clean", () => del(["test/**/*.js", "test/**/*.js.map"]));

gulp.task("build:reflect", () => gulp
    .src(["Reflect.ts"])
    .pipe(project())
    .pipe(gulp.dest(".")));

gulp.task("build:tests", ["build:reflect"], () => gulp
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

gulp.task("build", ["build:tests", "build:spec"]);

gulp.task("use-polyfill", () => {
    process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "true";
});

gulp.task("test", ["build:tests"], () => gulp
    .src(["test/**/*.js"], { read: false })
    .pipe(mocha({ reporter: "dot" })));

gulp.task("test:use-polyfill", ["build:tests", "use-polyfill"], () => gulp
    .src(["test/**/*.js"], { read: false })
    .pipe(mocha({ reporter: "dot" })));

gulp.task("watch:reflect", () => gulp.watch(["Reflect.ts", "tsconfig.json", "test/**/*.ts", "test/**/tsconfig.json"], ["test"]));
gulp.task("watch:spec", () => gulp.watch(["spec.html"], ["build:spec"]));
gulp.task("watch", ["watch:reflect", "watch:spec"], () => {
    const server = gls.static("docs", 8080);
    const promise = server.start();
    gulp.watch(["docs/**/*"], file => server.notify(file));
    return promise;
});

gulp.task("prepublish", sequence("clean", "test", "test:use-polyfill"));
gulp.task("reflect", ["build:reflect"]);
gulp.task("tests", ["build:tests"]);
gulp.task("spec", ["build:spec"]);
gulp.task("start", ["watch"]);
gulp.task("default", ["build", "test"]);
