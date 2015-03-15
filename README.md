Proposal to add Decorators to ES7, along with a prototype for an ES7 Reflection API for Decorator Metadata

# <a name="1"/>1 Motivating examples

## <a name="1.1"/>1.1 Conditional implementation 

Conditional code generation:

```TypeScript
class Debug {  
    @conditional("debug")  
    static assert(condition: boolean, message?: string): void;  
}  
  
Debug.assert(false); // if window.debug is not defined Debug.assert is replaced by an empty function
```

## <a name="1.2"/>1.2 Observable and computed properties

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

## <a name="1.3"/>1.3 Dynamic Instantiation (composition)

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

## <a name="1.4"/>1.4 Attaching Meta data to functions/objects

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

## <a name="1.5"/>1.5 Design-time extensibility

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

# <a name="2"/>2 Proposal

## <a name="2.1"/>2.1 Terms

### <a name="2.1.1"/>2.1.1 Decorator

A *decorator* is an expression that is evaluated after a class has been defined, that can be used to annotate or modify the class in some fashion. This expression must evaluate to a **function**, which is executed by the runtime to apply the decoration.

```TypeScript
@decoratorExpression
class C {
}
```

### <a name="2.1.2"/>2.1.2 Class Decorator Function

A *class decorator function* is a function that accepts a constructor function as its argument, and returns either `undefined`, the provided constructor function, or a new constructor function. Returning `undefined` is equivalent to returning the provided constructor function.

```TypeScript
// A class decorator
function dec(target) {  
   // modify, annotate, or replace target...
}
```

### <a name="2.1.3"/>2.1.3 Property/Method Decorator Function

A *property decorator function* is a function that accepts three arguments: The object that owns the property, the key for the property (a `string` or a `symbol`), and optionally the property descriptor of the property. The function must return either `undefined`, the provided property descriptor, or a new property descriptor. Returning `undefined` is equivalent to returning the provided property descriptor.

```TypeScript
// A property (or method/accessor) decorator
function dec(target, key, descriptor) {
	// annotate the target and key; or modify or replace the descriptor...
}
```

### <a name="2.1.4"/>2.1.4 Parameter Decorator Function

A *parameter decorator function* is a function that accepts two arguments: The function that contains the decorated parameter, and the ordinal index of the parameter. The return value of this decorator is ignored.

```TypeScript
// A parameter decorator
function dec(target, paramIndex) {
	// annotate the target and index
}
```

### <a name="2.1.5"/>2.1.5 Decorator Factory

A *decorator factory* is a function that can accept any number of arguments, and must return one of the above types of *decorator function*.

```TypeScript
// a class decorator factory
function dec(x, y) {
	// the class decorator function
	return function (target) {
		// modify, annotate, or replace target...
	}
}
```

## <a name="2.2"/>2.2 Decorator Targets

A *decorator* **can** be legally applied to any of the following:

* A class declaration
* A class property declaration (static or prototype)
* A class method declaration (static or prototype)
* A class get or set accessor declaration (static or prototype)
* A parameter of a class constructor
* A parameter of a class method (static or prototype)
* A parameter of a class get or set accessor (static or prototype)

Please note that a *decorator* currently **cannot** be legally applied to any of the following:

* A class constructor - This is to reduce ambiguity between where you can apply a decorator (on the class or on its constructor) and which of the above *decorator function* forms is called.
* A function declaration - Decorators on a function declaration would introduce a TDZ (Temporal Dead Zone), which would make the function unreachable until its declaration is executed. This could cause confusion as an undecorated function declaration is hoisted and can be used in a statement preceeding the declaration.
* A function expression - This is to reduce confusion and maintain parity with disallowing decorators on a function declaration.
* An arrow function - This is to reduce confusion and maintain parity with disallowing decorators on a function expression.

This list may change in the future. 

## <a name="2.3"/>2.3 Decorator Evaluation and Application Order

Decorators are *evaluated* in the order they appear preceeding their target declaration, to preserve side-effects due to evaluation order. Decorators are *applied* to their target declaration in reverse order, starting with the decorator closest to the declaration. This behavior is specified to preserve the expected behavior of decorators without a declarative syntax. 

```TypeScript
@F
@G
class C {	
}
```

For example, the above listing could be approximately written without decorators in the following fashion:

```TypeScript
C = F(G(C))
```

In the above example, the expression `F` is *evaluated* first, followed by the expression `G`. `G` is then called with the constructor function as its argument, followed by calling `F` with the result.  The actual process of applying decorators is more complex than the above example however, though you may still imperatively apply decorators with a reflection API.

If a class declaration has decorators on both the class and any of its members or parameters, the decorators are applied using the following pseudocode:

```
for each member M of class C
	if M is an accessor then
		let accessor = first accessor (get or set, in declaration order) of M
		let memberDecorators = decorators of accessor
		for each parameter of accessor
			let paramDecorators = decorators of parameter			
			let paramIndex = ordinal index of parameter
			Reflect.decorate(paramDecorators, accessor, paramIndex)
		next parameter

		let accessor = second accessor (get or set, in declaration order) of M
		if accessor then
			let memberDecorators = memberDecorators + decorators of accessor
			for each parameter of accessor
				let paramDecorators = decorators of parameter			
				let paramIndex = ordinal index of parameter
				Reflect.decorate(paramDecorators, accessor, paramIndex)
			next parameter
		end if
	else if M is a method
		let memberDecorators = decorators of M
		for each parameter of M
			let paramDecorators = decorators of parameter			
			let paramIndex = ordinal index of parameter
			Reflect.decorate(paramDecorators, M, paramIndex)
		next parameter
	else
		let memberDecorators = decorators of M
	end if

	let name = name of M
	let target = C.prototype if M is on the prototype; otherwise, C if M is static	
	Reflect.decorate(memberDecorators, C, name)
next member

for each parameter of C
	let paramDecorators = decorators of parameter
	let paramIndex = ordinal index of parameter
	Reflect.decorate(paramDecorators, C, paramIndex)
next parameter

let classDecorators = decorators of C
let C = Reflect.decorate(classDecorators, C)
```

# <a name="3"/>3 Transformation details

The following are examples of how decorators can be desugared to ES6 (through a transpiler such as TypeScript). These examples levarage an imperative reflection API.

## <a name="3.1"/>3.1 Class Declaration

### <a name="3.1.1"/>3.1.1 Syntax

```TypeScript
@F("color")  
@G  
class C {
}
```

### <a name="3.1.2"/>3.1.2 ES6 Desugaring

```TypeScript
var C = (function () {  
    class C {  
    }

    C = Reflect.decorate([F("color"), G], C);
    return C;
})();
```

## <a name="3.2"/>3.2 Class Method Declaration

### <a name="3.2.1"/>3.2.1 Syntax

```TypeScript
class C {  
    @F("color")  
    @G  
    bar() { }  
}
```

### <a name="3.2.2"/>3.2.2 ES6 Desugaring

```TypeScript
var C = (function () {  
    class C {  
        bar() { }  
    }

    Reflect.decorate([F("color"), G], C.prototype, "bar");
    return C;  
})();
```

## <a name="3.3"/>3.3 Class Accessor Declaration

### <a name="3.3.1"/>3.3.1 Syntax

```TypeScript
class C {  
    @F("color")  
    get bar() { }  

    @G  
    set bar(value) { }  
}
```

### <a name="3.3.2"/>3.3.2 ES6 Desugaring

```TypeScript
var C = (function () {  
    class C {  
        get bar() { }  
        set bar(value) { }  
    }  

    Reflect.decorate([F("color"), G], C.prototype, "bar");
    return C;  
})();
```

## <a name="3.4"/>3.4 Class Property Declaration (TypeScript)

### <a name="3.4.1"/>3.4.1 Syntax

```TypeScript
class C {  
    @F("color") 
    @g
    property;
}
```

### <a name="3.4.2"/>3.4.2 ES6 Desugaring

```TypeScript
var C = (function () {  
    class C {  
    }  

    Reflect.decorate([F("color"), G], C.prototype, "property");
    return C;  
})();
```

## <a name="3.5"/>3.5 Constructor Parameter Declaration

### <a name="3.5.1"/>3.5.1 Syntax

```TypeScript
class C {  
    constructor(@F("color") @G x) {
    }
}
```

### <a name="3.5.2"/>3.5.2 ES6 Desugaring

```TypeScript
var C = (function () {  
    class C {  
        constructor(x) {  
        }  
    }  
  
  	Reflect.decorate([F("color"), G], C, /*paramIndex*/ 0);
    return C;  
})();
```

## <a name="3.6"/>3.6 Method Parameter Declaration

### <a name="3.6.1"/>3.6.1 Syntax

```TypeScript
class C {  
    method(@F("color") @G x) {
    }
}
```

### <a name="3.6.2"/>3.6.2 ES6 Desugaring

```TypeScript
var C = (function () {  
    class C {  
        method(x) {  
        }  
    }  
  
  	Reflect.decorate([F("color"), G], C.prototype.method, /*paramIndex*/ 0);
    return C;  
})();
```

## <a name="3.7"/>3.7 Set Accessor Parameter Declaration

### <a name="3.7.1"/>3.7.1 Syntax

```TypeScript
class C {  
    set accessor(@F("color") @G x) {
    }
}
```

### <a name="3.5.2"/>3.5.2 ES6 Desugaring

```TypeScript
var C = (function () {  
    class C {  
        set accessor(x) {  
        }  
    }  
  
  	Reflect.decorate([F("color"), G], Object.getOwnPropertyDescriptor(C.prototype, "accessor").set, /*paramIndex*/ 0);
    return C;  
})();
```

# <a name="4"> 4 Metadata Reflection API
In addition to a declarative approach to defining decorators, it is necessary to also include an imperative API capable of applying decorators, as well as defining, reflecting over, and removing decorator metadata from an object, property, or parameter. 

A shim for this API can be found here: https://github.com/rbuckton/ReflectDecorators

## <a name="4.1"> 4.1 API
```TypeScript
type ClassDecorator = (target: Function) => Function | void;
type ParameterDecorator = (target: Function, paramIndex: number) => void;
type PropertyDecorator = (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor | void;
type Decorator = ClassDecorator | ParameterDecorator | PropertyDecorator;

module Reflect {
    
    // decorator application
    export function decorate(decorators: ClassDecorator[], target: Function): Function;
    export function decorate(decorators: ParameterDecorator[], target: Function, paramIndex: number): void;
    export function decorate(decorators: PropertyDecorator[]), target: Object, propertyKey: string | symbol): void;

    // built-in metadata decorator factory
    export function metadata(metadataKey: any, metadataValue: any): Decorator;
    
    // metadata
    export function defineMetadata(metadataKey: any, metadata: any, target: Object): void;
    export function defineMetadata(metadataKey: any, metadata: any, target: Object, targetParamIndex: number): void;
    export function defineMetadata(metadataKey: any, metadata: any, target: Object, targetPropertyKey: string | symbol): void;
    
    export function hasMetadata(metadataKey: any, target: Object): boolean;
    export function hasMetadata(metadataKey: any, target: Object, targetParamIndex: number): boolean;
    export function hasMetadata(metadataKey: any, target: Object, targetPropertyKey: string | symbol): boolean;

    export function hasOwnMetadata(metadataKey: any, target: Object): boolean;
    export function hasOwnMetadata(metadataKey: any, target: Object, targetParamIndex: number): boolean;
    export function hasOwnMetadata(metadataKey: any, target: Object, targetPropertyKey: string | symbol): boolean;

    export function getMetadata(metadataKey: any, target: Object): any;
    export function getMetadata(metadataKey: any, target: Object, targetParamIndex: number): any;
    export function getMetadata(metadataKey: any, target: Object, targetPropertyKey: string | symbol): any;

    export function getOwnMetadata(metadataKey: any, target: Object): any;
    export function getOwnMetadata(metadataKey: any, target: Object, targetParamIndex: number): any;
    export function getOwnMetadata(metadataKey: any, target: Object, targetPropertyKey: string | symbol): any;

    export function getMetadataKeys(target: Object): any[];
    export function getMetadataKeys(target: Object, targetParamIndex: number): any[];
    export function getMetadataKeys(target: Object, targetPropertyKey: string | symbol): any[];

    export function getOwnMetadataKeys(target: Object): any[];
    export function getOwnMetadataKeys(target: Object, targetParamIndex: number): any[];
    export function getOwnMetadataKeys(target: Object, targetPropertyKey: string | symbol): any[];

    export function deleteMetadata(metadataKey: any, target: Object): boolean;
    export function deleteMetadata(metadataKey: any, target: Object, targetParamIndex: number): boolean;
    export function deleteMetadata(metadataKey: any, target: Object, targetPropertyKey: string | symbol): boolean;

    export function mergeMetadata(target: Object, source: Object): Object;
}
```

## <a name="4.2"> 4.2 Examples

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
  return (target, parameterIndex) => Reflect.defineParameterMetadata(Inject, type, target, parameterIndex);
}

// NOTE: A "decorator" factory for a parameter cannot mutate the parameter.
```

### <a name="4.2.1"> 4.2.1 Declarative Usage
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

### <a name="4.2.2"> 4.2.2 Imperative Usage
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

### <a name="4.2.3"> 4.2.3 Composition Sample
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
      let injectType = Reflect.getParameterMetadata(componentType, i, Inject);
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

# <a name="A"/>A Grammar

NOTE: this section is out of date and will soon be updated.

## <a name="A.1"/>A.1 Expressions

&emsp;&emsp;*DecoratorList*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp; *Decorator*<sub> [?Yield]</sub>

&emsp;&emsp;*Decorator*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;`@`&emsp;*AssignmentExpression*<sub> [?Yield]</sub>

&emsp;&emsp;*PropertyDefinition*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;*IdentifierReference*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*CoverInitializedName*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*PropertyName*<sub> [?Yield]</sub>&emsp; `:`&emsp;*AssignmentExpression*<sub> [In, ?Yield]</sub>  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;*MethodDefinition*<sub> [?Yield]</sub>

&emsp;&emsp;*CoverMemberExpressionSquareBracketsAndComputedPropertyName*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;`[`&emsp;*Expression*<sub> [In, ?Yield]</sub>&emsp;`]`

NOTE	The production *CoverMemberExpressionSquareBracketsAndComputedPropertyName* is used to cover parsing a *MemberExpression* that is part of a *Decorator* inside of an *ObjectLiteral* or *ClassBody*, to avoid lookahead when parsing a decorator against a *ComputedPropertyName*. 

&emsp;&emsp;*PropertyName*<sub> [Yield, GeneratorParameter]</sub>&emsp;:  
&emsp;&emsp;&emsp;*LiteralPropertyName*  
&emsp;&emsp;&emsp;[+GeneratorParameter] *CoverMemberExpressionSquareBracketsAndComputedPropertyName*  
&emsp;&emsp;&emsp;[~GeneratorParameter] *CoverMemberExpressionSquareBracketsAndComputedPropertyName*<sub> [?Yield]</sub>

&emsp;&emsp;*MemberExpression*<sub> [Yield]</sub>&emsp; :  
&emsp;&emsp;&emsp;[Lexical goal *InputElementRegExp*] *PrimaryExpression*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*MemberExpression*<sub> [?Yield]</sub>&emsp;*CoverMemberExpressionSquareBracketsAndComputedPropertyName*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*MemberExpression*<sub> [?Yield]</sub>&emsp;`.`&emsp;*IdentifierName*  
&emsp;&emsp;&emsp;*MemberExpression*<sub> [?Yield]</sub>&emsp;*TemplateLiteral*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*SuperProperty*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*NewSuper*&emsp;*Arguments*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;`new`&emsp;*MemberExpression*<sub> [?Yield]</sub>&emsp;*Arguments*<sub> [?Yield]</sub>

&emsp;&emsp;*SuperProperty*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;`super`&emsp;*CoverMemberExpressionSquareBracketsAndComputedPropertyName*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;`super`&emsp;`.`&emsp;*IdentifierName*

&emsp;&emsp;*CallExpression*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;*MemberExpression*<sub> [?Yield]</sub>&emsp;*Arguments*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*SuperCall*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*CallExpression*<sub> [?Yield]</sub>&emsp;*Arguments*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*CallExpression*<sub> [?Yield]</sub>&emsp;*CoverMemberExpressionSquareBracketsAndComputedPropertyName*<sub> [In, ?Yield]</sub>  
&emsp;&emsp;&emsp;*CallExpression*<sub> [?Yield]</sub>&emsp;`.`&emsp;*IdentifierName*  
&emsp;&emsp;&emsp;*CallExpression*<sub> [?Yield]</sub>&emsp;*TemplateLiteral*<sub> [?Yield]</sub>

## <a name="A.4"/>A.4 Functions and Classes

&emsp;&emsp;*FormalRestParameter*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;*BindingRestElement*<sub> [?Yield]</sub>

&emsp;&emsp;*FormalParameter*<sub> [Yield, GeneratorParameter]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;*BindingElement*<sub> [?Yield, ?GeneratorParameter]</sub>

&emsp;&emsp;*ClassDeclaration*<sub> [Yield, Default]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;`class`&emsp;*BindingIdentifier*<sub> [?Yield]</sub>&emsp;*ClassTail*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;[+Default] *DecoratorList*<sub> [?Yield]opt</sub>&emsp;`class`&emsp;*ClassTail*<sub> [?Yield]</sub>

&emsp;&emsp;*ClassExpression*<sub> [Yield, GeneratorParameter]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;`class`&emsp;*BindingIdentifier*<sub> [?Yield]opt</sub>&emsp;*ClassTail*<sub> [?Yield, ?GeneratorParameter]</sub>

&emsp;&emsp;*ClassElement*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;*MethodDefinition*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;`static`&emsp;*MethodDefinition*<sub> [?Yield]</sub>

## <a name="A.5"/>A.5 Scripts and Modules

&emsp;&emsp;*ExportDeclaration*&emsp;:  
&emsp;&emsp;&emsp;`export`&emsp;`*`&emsp;*FromClause*&emsp;`;`  
&emsp;&emsp;&emsp;`export`&emsp;*ExportClause*&emsp;*FromClause*&emsp;`;`  
&emsp;&emsp;&emsp;`export`&emsp;*ExportClause*&emsp;`;`  
&emsp;&emsp;&emsp;`export`&emsp;*VariableStatement*  
&emsp;&emsp;&emsp;`export`&emsp;*LexicalDeclaration*  
&emsp;&emsp;&emsp;*DecoratorList*<sub> opt</sub>&emsp;`export`&emsp;[lookahead ≠ @]&emsp;*HoistableDeclaration*  
&emsp;&emsp;&emsp;*DecoratorList*<sub> opt</sub>&emsp;`export`&emsp;[lookahead ≠ @]&emsp;*ClassDeclaration*  
&emsp;&emsp;&emsp;*DecoratorList*<sub> opt</sub>&emsp;`export`&emsp;`default`&emsp;[lookahead ≠ @]&emsp;*HoistableDeclaration*<sub> [Default]</sub>  
&emsp;&emsp;&emsp;*DecoratorList*<sub> opt</sub>&emsp;`export`&emsp;`default`&emsp;[lookahead ≠ @]&emsp;*ClassDeclaration*<sub> [Default]</sub>  
&emsp;&emsp;&emsp;`export`&emsp;`default`&emsp;[lookahead  { function, class, @ }]&emsp;*AssignmentExpression*<sub> [In]</sub>&emsp;`;`

# <a name="B"/>B Decorator definitions (TypeScript)

```TypeScript
interface TypedPropertyDescriptor<T> {  
    enumerable?: boolean;  
    configurable?: boolean;  
    writable?: boolean;  
    value?: T;  
    get?: () => T;  
    set?: (value: T) => void;  
}  
  
interface ClassDecorator<TFunction extends Function> {  
    (target: TFunction): TFunction | void;  
}  
  
interface ParameterDecorator {  
    (target: Function, parameterIndex: number): void;  
}  
  
interface PropertyDecorator<T> {  
    (target: Object, propertyKey: PropertyKey, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> | void;  
}  
```

# <a name="C"/>C TypeScript decorators

## <a name="C.1"/>C.1 Exposing types

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
var __decorate = this.__decorate || function (decorators, target, key) {
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
		return Reflect.decorate(decorators, target, key);
	}
	// minimal fallback implementation ...
};
var __metadata = this.__metadata || function (metadataKey, metadataValue) { 
	if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
		return Reflect.metadata(metadataKey, metadataValue);
	}
	return function() { 
		// default to no metadata
	}
};

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

## <a name="C.2"/>C.2 Type Serialization:

### <a name="C.2.1"/>C.2.1 Example

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

### <a name="C.2.2"/>C.2.2 Details

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

### <a name="C.2.3"/>C.2.3 Helpers for libraries like AngularJS

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
define(["exports", annotations"], function (exports, annotations) {
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

### <a name="C.2.3"/>C.2.3 Open issues

* Do we want to enable more elaborate serialization? 
	* Serialize interfaces or type literals? For example, serialize the type literal `{ a: string; b: number }` as `{ a: String, b: Number }` instead of just `Object`.
	* Serialize generic type references? One suggestion was to serialize `Array<Number>` as `[Array, Number]`
	* Serialize tuple types?
	* Serialize union types?
