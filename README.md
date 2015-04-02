Proposal to add Decorators to ES7, along with a prototype for an ES7 Reflection API for Decorator Metadata

The ECMAScript proposal for Decorators can be found at: (http://rbuckton.github.io/ReflectDecorators/index.html)  
The TypeScript proposal for Decorators can be found at: (http://rbuckton.github.io/ReflectDecorators/typescript.html)  

# Motivating examples

## Conditional implementation 

Conditional code generation:

```TypeScript
class Debug {  
    @conditional("debug")  
    static assert(condition: boolean, message?: string): void;  
}  
  
Debug.assert(false); // if window.debug is not defined Debug.assert is replaced by an empty function
```

## Observable and computed properties

Consider the Ember.js alias-like definition:

```TypeScript
class Person {  
    constructor(public firstName: string, public lastName: string) { }
  
    @computed('firstName', 'lastName', (f, l) => l + ', ' + f)  
    fullName: string;
}  
  
var david = new Person('David', 'Tang');  
david.fullName; /// Tang, David
```

## Dynamic Instantiation (composition)

Consider Angular 2.0 DI implementation example:

```TypeScript
class Engine {  
}  
  
class Car {  
    constructor(@Inject(Engine) engine: Engine) {}  
}  
  
var inj = new Injector([Car, Engine]);  
  
// AtScript compilation step adds a property “annotations” on Car of value [ new Inject(Engine) ].  
// At runtime, a call to inj.get would cause Angular to look for annotations, and try to satisfy dependencies.  
// in this case first by creating a new instance of Engine if it does not exist, and use it as a parameter to Car’s constructor  
var car = inj.get(Car);
```

## Attaching Metadata to functions/objects

Metadata that can be queried at runtime, for example:

```TypeScript
class Fixture {  
    @isTestable(true)  
    getValue(a: number): string {  
        return a.toString();  
    }  
}  
  
// Desired JS  
class Fixture {  
    getValue(a) {  
        return a.toString();  
    }  
}  
Fixture.prototype.getValue.meta.isTestable = true;  
  
// later on query the meta data  
function isTestableFunction(func) {  
    return !!(func && func.meta && func.meta.isTestable);  
}
```

## Design-time extensibility

An extensible way to declare properties on or associate special behavior to declarations; design time tools can leverage these associations to produce errors or produce documentation. For example:

Deprecated, to support warning on use of specific API’s:

```TypeScript
interface JQuery {  
    /**  
     * A selector representing selector passed to jQuery(), if any, when creating the original set.  
     * version deprecated: 1.7, removed: 1.9  
     */  
    @deprecated("Property is only maintained to the extent needed for supporting .live() in the jQuery Migrate plugin. It may be removed without notice in a future version.", false)  
    selector: string;  
}
```

Suppress linter warning:

```TypeScript
@suppressWarning("disallow-leading-underscore")   
function __init() {  
}
```

## Examples

```TypeScript
// An "annotation" factory for a class
function Component(options) {
  return target => Reflect.defineMetadata("component", options, target);
}

// A "decorator" factory that replaces the function/class with a proxy
function Logged(message) {
  return target => new Proxy(target, {
    apply(target, thisArg, argArray) {
      console.log(message);
      return Reflect.apply(target, thisArg, argArray);
    },
    construct(target, thisArg, argArray) {
      console.log(message);
      return Reflect.construct(target, argArray);
    }
  });
}

// An "annotation" factory for a member
function MarshalAs(options) {
  return (target, propertyKey) => Reflect.defineMetadata(MarshalAs, options, target, propertyKey);
}

// A "decorator" factory for a member that mutates its descriptor
function Enumerable(value) {
  return (target, propertyKey, descriptor) => {
    descriptor.enumerable = value;
    return descriptor;
  };
}

// An "annotation" factory for a parameter
function Inject(type) {
  return (target, parameterIndex) => Reflect.defineMetadata(Inject, type, target, parameterIndex);
}

// NOTE: A "decorator" factory for a parameter cannot mutate the parameter.
```

### Declarative Usage
```TypeScript
@Component({ /*options...*/ })
@Logged("Called class")
class MyComponent extends ComponentBase {
  constructor(@Inject(ServiceBase) myService) {
    this.myService = myService;
  }
  
  @MarshalAs({ /*options...*/ })
  @Enumerable(true)
  get service() {
    return this.myService;
  }
}
```

### Imperative Usage
```TypeScript
class MyComponent extends ComponentBase {
  constructor(myService) {
    this.myService = myService;
  }
  
  get service() {
    return this.myService;
  }
}

Reflect.decorate([MarshalAs({ /*options...*/}), Enumerable(true)], MyComponent.prototype, "service");
Reflect.decorate([Inject(ServiceBase)], MyComponent, 0);
MyComponent = Reflect.decorate([Component({ /*options...*/ }), Logged("called class")], MyComponent);
```

### Composition Sample
```TypeScript
// read annotations
class Composer {
  constructor() {
    this.types = new Map();
    this.components = new Map();
  }
  for(baseType) {
    return { use: (componentType) => this.types.set(baseType, componentType) };
  }
  get(type) {
    if (this.components.has(type)) {
      return this.components.get(type);
    }
    let componentType = type;
    if (this.types.has(type)) {
      componentType = this.types.get(type);
    }
    let args = new Array(componentType.length);
    for (let i = 0; i < args.length; i++) {
      let injectType = Reflect.getMetadata(Inject, componentType, i);
      if (injectType) {
        args[i] = this.get(injectType);
      }
    }
    let component = Reflect.construct(componentType, args);
    this.components.set(type, component);
    return component;
  }
}


let composer = new Composer();
composer.for(ServiceBase).use(MyService);
composer.for(ComponentBase).use(MyComponent);
let component = composer.get(ComponentBase);
```

# TypeScript decorators

## Exposing types

TypeScript compiler can add additional type information then a declaration includes decorators. The types provided are in a serialized form. Serialization logic is descriped in C.2. Reading this type information requires the use of a reflection API (or polyfill for ES6).

```TypeScript
@dec
class C {  
    constructor(a: Object, b: number, c: { a: number }, d: C2) {  
    }

    @dec
    property: string;    

    @dec
    method(): boolean {
    	return true;
    }
}  
  
function dec(target: Object, keyOrIndex?: string | symbol | number): void {
	var type = Reflect.getMetadata("design:type", target, keyOrIndex);
	var paramTypes = Reflect.getMetadata("design:paramtypes", target, keyOrIndex);    
	var returnType = Reflect.getMetadata("design:returntype", target, keyOrIndex);
}

// ES7 emit
@dec
@Reflect.metadata("design:type", Function)
@Reflect.metadata("design:paramtypes", [Object, Number, Object, C2 || Object])
class C {  
    constructor(a: Object, b: number, c: { a: number }, d: C2) {  
    }  

    @dec
    @Reflect.metadata("design:type", String)
    property; // assumes property declarations in ES7

    @dec
    @Reflect.metadata("design:type", Function)
    @Reflect.metadata("design:paramtypes", [])
    @Reflect.metadata("design:returntype", Boolean)
    method() {
    }
}  

// ES6 emit
var __decorate = this.__decorate || (typeof Reflect === "object" && Reflect.decorate) || function (decorators, target, key) {
    var kind = key == null ? 0 : typeof key === "number" ? 1 : 2, result = target;
    if (kind == 2) result = Object.getOwnPropertyDescriptor(target, typeof key === "symbol" ? key : key = String(key));
    for (var i = decorators.length - 1; i >= 0; --i) {
        var decorator = decorators[i];
        result = (kind == 0 ? decorator(result) : kind == 1 ? decorator(target, key) : decorator(target, key, result)) || result;
    }
    if (kind === 2 && result) Object.defineProperty(target, key, result);
    if (kind === 0) return result;
};
var __metadata = this.__metadata || (typeof Reflect === "object" && Reflect.metadata) || function () { return function () { }; };

var C = (function() {
	class C {  
	    constructor(a, b, c, d) {  
	    }
	    method() {	    
		}
	}
	__decorate([dec, __metadata("design:type", String)], C.prototype, "property");
	__decorate([dec, __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", Boolean)], C.prototype, "method");
	C = __decorate([dec, __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Number, Object, C2 || Object])], C);
	return C;  
})();
```

## Type Serialization:

### Example

```TypeScript
class C { }  
interface I { }  
enum E { }  
module M { }
```

Formal parameter list in a call signature like so:

```TypeScript
(a: number, b: boolean, c: C, i: I, e: E, m: typeof M, f: () => void, o: { a: number; b: string; })
```

Serializes as:

```TypeScript
[Number, Boolean, C, Object, Number, Object, Function, Object]
```

### Details

* number serialized as Number
* string serialized as String
* boolean serialized as Boolean
* any serialized as Object
* void serializes as undefined
* Array serialized as Array
* If a Tuple, serialize as Array
* If a class serialize it as the class constructor
* If an Enum serialize it as Number
* If has at least one call signature, serialize as Function
* Otherwise serialize as Object

### Helpers for libraries like AngularJS

Some applications may need a way to easily inject type information in a fashion similar to TypeScript's mechanism, though the applications themselves are written using regular JavaScript. A library could choose to make this process easier for these applications by exposing wrapper metadata functions:

```TypeScript
// [annotations.ts]
export function Type(type: Function): Decorator {
	return Reflect.metadata("design:type", type);
}

export function ParamTypes(...types: Function[]): Decorator {
	return Reflect.metadata("design:paramtypes", types);
}

export function ReturnType(type: Function): Decorator {
	return Reflect.metadata("design:returntype", type);
}

// app.js
define(["exports", "annotations"], function (exports, annotations) {
	var Component = annotations.Component;
	var Type = annotations.Type;
	var ParamTypes = annotations.ParamTypes;
	var ReturnType = annotations.ReturnType;

	function MyComponent(a, b) {
	}
	
	MyComponent = Reflect.decorate([Component({ ... }), Type(Function), ParamTypes([UserServiceBase, LocationServiceBase])], MyComponent);
	exports.MyComponent = MyComponent;
})
```

TypeScript would **not** be providing these helpers, it would be up to library authors to add these if they determine they are necessary. 

### Open issues

* Do we want to enable more elaborate serialization? 
	* Serialize interfaces or type literals? For example, serialize the type literal `{ a: string; b: number }` as `{ a: String, b: Number }` instead of just `Object`.
	* Serialize generic type references? One suggestion was to serialize `Array<Number>` as `[Array, Number]`
	* Serialize tuple types?
	* Serialize union types?
