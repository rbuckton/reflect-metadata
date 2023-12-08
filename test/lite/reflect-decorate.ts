// Reflect.decorate ( decorators, target [, propertyKey [, descriptor] ] )

/// <reference path="../../index.d.ts" />
require("../../ReflectLite");
import { assert } from "chai";

describe("Reflect.decorate", () => {
    it("ThrowsIfDecoratorsArgumentNotArrayForFunctionOverload", () => {
        let target = function() { };
        assert.throws(() => Reflect.decorate(undefined!, target, undefined!, undefined), TypeError);
    });

    it("ThrowsIfTargetArgumentNotFunctionForFunctionOverload", () => {
        let decorators: (MethodDecorator | PropertyDecorator)[] = [];
        let target = {};
        assert.throws(() => Reflect.decorate(decorators, target, undefined!, undefined), TypeError);
    });

    it("ThrowsIfDecoratorsArgumentNotArrayForPropertyOverload", () => {
        let target = {};
        let name = "name";
        assert.throws(() => Reflect.decorate(undefined!, target, name, undefined), TypeError);
    });

    it("ThrowsIfTargetArgumentNotObjectForPropertyOverload", () => {
        let decorators: (MethodDecorator | PropertyDecorator)[] = [];
        let target = 1;
        let name = "name";
        assert.throws(() => Reflect.decorate(decorators, target, name, undefined), TypeError);
    });

    it("ThrowsIfDecoratorsArgumentNotArrayForPropertyDescriptorOverload", () => {
        let target = {};
        let name = "name";
        let descriptor = {};
        assert.throws(() => Reflect.decorate(undefined!, target, name, descriptor), TypeError);
    });

    it("ThrowsIfTargetArgumentNotObjectForPropertyDescriptorOverload", () => {
        let decorators: (MethodDecorator | PropertyDecorator)[] = [];
        let target = 1;
        let name = "name";
        let descriptor = {};
        assert.throws(() => Reflect.decorate(decorators, target, name, descriptor), TypeError);
    });

    it("ExecutesDecoratorsInReverseOrderForFunctionOverload", () => {
        let order: number[] = [];
        let decorators = [
            (_target: Function): void => { order.push(0); },
            (_target: Function): void => { order.push(1); }
        ];
        let target = function() { };
        Reflect.decorate(decorators, target);
        assert.deepEqual(order, [1, 0]);
    });

    it("ExecutesDecoratorsInReverseOrderForPropertyOverload", () => {
        let order: number[] = [];
        let decorators = [
            (_target: Object, _name: string | symbol): void => { order.push(0); },
            (_target: Object, _name: string | symbol): void => { order.push(1); }
        ];
        let target = {};
        let name = "name";
        Reflect.decorate(decorators, target, name, undefined);
        assert.deepEqual(order, [1, 0]);
    });

    it("ExecutesDecoratorsInReverseOrderForPropertyDescriptorOverload", () => {
        let order: number[] = [];
        let decorators = [
            (_target: Object, _name: string | symbol): void => { order.push(0); },
            (_target: Object, _name: string | symbol): void => { order.push(1); }
        ];
        let target = {};
        let name = "name";
        let descriptor = {};
        Reflect.decorate(decorators, target, name, descriptor);
        assert.deepEqual(order, [1, 0]);
    });

    it("DecoratorPipelineForFunctionOverload", () => {
        let A = function A(): void { };
        let B = function B(): void { };
        let decorators = [
            (_target: Function): any => { return undefined; },
            (_target: Function): any => { return A; },
            (_target: Function): any => { return B; }
        ];
        let target = function (): void { };
        let result = Reflect.decorate(decorators, target);
        assert.strictEqual(result, A);
    });

    it("DecoratorPipelineForPropertyOverload", () => {
        let A = {};
        let B = {};
        let decorators = [
            (_target: Object, _name: string | symbol): any => { return undefined; },
            (_target: Object, _name: string | symbol): any => { return A; },
            (_target: Object, _name: string | symbol): any => { return B; }
        ];
        let target = {};
        let result = Reflect.decorate(decorators, target, "name", undefined);
        assert.strictEqual(result, A);
    });

    it("DecoratorPipelineForPropertyDescriptorOverload", () => {
        let A = {};
        let B = {};
        let C = {};
        let decorators = [
            (_target: Object, _name: string | symbol): any => { return undefined; },
            (_target: Object, _name: string | symbol): any => { return A; },
            (_target: Object, _name: string | symbol): any => { return B; }
        ];
        let target = {};
        let result = Reflect.decorate(decorators, target, "name", C);
        assert.strictEqual(result, A);
    });

    it("DecoratorCorrectTargetInPipelineForFunctionOverload", () => {
        let sent: Function[] = [];
        let A = function A(): void { };
        let B = function B(): void { };
        let decorators = [
            (target: Function): any => { sent.push(target); return undefined; },
            (target: Function): any => { sent.push(target); return undefined; },
            (target: Function): any => { sent.push(target); return A; },
            (target: Function): any => { sent.push(target); return B; }
        ];
        let target = function (): void { };
        Reflect.decorate(decorators, target);
        assert.deepEqual(sent, [target, B, A, A]);
    });

    it("DecoratorCorrectTargetInPipelineForPropertyOverload", () => {
        let sent: Object[] = [];
        let decorators = [
            (target: Object, _name: string | symbol): any => { sent.push(target); },
            (target: Object, _name: string | symbol): any => { sent.push(target); },
            (target: Object, _name: string | symbol): any => { sent.push(target); },
            (target: Object, _name: string | symbol): any => { sent.push(target); }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name");
        assert.deepEqual(sent, [target, target, target, target]);
    });

    it("DecoratorCorrectNameInPipelineForPropertyOverload", () => {
        let sent: (symbol | string)[] = [];
        let decorators = [
            (_target: Object, name: string | symbol): any => { sent.push(name); },
            (_target: Object, name: string | symbol): any => { sent.push(name); },
            (_target: Object, name: string | symbol): any => { sent.push(name); },
            (_target: Object, name: string | symbol): any => { sent.push(name); }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name");
        assert.deepEqual(sent, ["name", "name", "name", "name"]);
    });

    it("DecoratorCorrectTargetInPipelineForPropertyDescriptorOverload", () => {
        let sent: Object[] = [];
        let A = { };
        let B = { };
        let C = { };
        let decorators = [
            (target: Object, _name: string | symbol): any => { sent.push(target); return undefined; },
            (target: Object, _name: string | symbol): any => { sent.push(target); return undefined; },
            (target: Object, _name: string | symbol): any => { sent.push(target); return A; },
            (target: Object, _name: string | symbol): any => { sent.push(target); return B; }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name", C);
        assert.deepEqual(sent, [target, target, target, target]);
    });

    it("DecoratorCorrectNameInPipelineForPropertyDescriptorOverload", () => {
        let sent: (symbol | string)[] = [];
        let A = { };
        let B = { };
        let C = { };
        let decorators = [
            (_target: Object, name: string | symbol): any => { sent.push(name); return undefined; },
            (_target: Object, name: string | symbol): any => { sent.push(name); return undefined; },
            (_target: Object, name: string | symbol): any => { sent.push(name); return A; },
            (_target: Object, name: string | symbol): any => { sent.push(name); return B; }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name", C);
        assert.deepEqual(sent, ["name", "name", "name", "name"]);
    });

    it("DecoratorCorrectDescriptorInPipelineForPropertyDescriptorOverload", () => {
        let sent: PropertyDescriptor[] = [];
        let A = { };
        let B = { };
        let C = { };
        let decorators = [
            (_target: Object, _name: string | symbol, descriptor: PropertyDescriptor): any => { sent.push(descriptor); return undefined; },
            (_target: Object, _name: string | symbol, descriptor: PropertyDescriptor): any => { sent.push(descriptor); return undefined; },
            (_target: Object, _name: string | symbol, descriptor: PropertyDescriptor): any => { sent.push(descriptor); return A; },
            (_target: Object, _name: string | symbol, descriptor: PropertyDescriptor): any => { sent.push(descriptor); return B; }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name", C);
        assert.deepEqual(sent, [C, B, A, A]);
    });
});
