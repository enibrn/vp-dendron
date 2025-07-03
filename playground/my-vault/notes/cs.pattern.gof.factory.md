---
id: c4qqh9t83k3lasdvaizegbr
title: Factory
desc: ''
updated: 1751554209971
created: 1751554209971
---
The Factory Method pattern provides an interface for creating objects in a superclass, allowing subclasses to alter the type of objects to be created. This promotes the creation of flexible and easily extensible code.

## Features

- **Creation Isolation**: Client classes do not need to know the logic for creating objects.
- **Flexibility**: Allows changing the type of object created by extending the base class.

## Implementation

Subclasses override the factory method to instantiate the desired type.

![image](./assets/images/2025-03-31-10-24-20.png)

## Example in TypeScript

The following example illustrates the Factory Method pattern in TypeScript.  
An abstract creator defines a method for creating objects, delegating the choice of implementation to subclasses.

```typescript
// Common interface for products
interface Product {
    operation(): string;
}

// Concrete implementations of the product
class ConcreteProductA implements Product {
    operation(): string {
        return "Result of Product A";
    }
}

class ConcreteProductB implements Product {
    operation(): string {
        return "Result of Product B";
    }
}

// Abstract creator class
abstract class Creator {
    // Factory method to be implemented in subclasses
    abstract factoryMethod(): Product;

    someOperation(): string {
        const product = this.factoryMethod();
        return product.operation();
    }
}

// Concrete implementations of the creator
class ConcreteCreatorA extends Creator {
    factoryMethod(): Product {
        return new ConcreteProductA();
    }
}

class ConcreteCreatorB extends Creator {
    factoryMethod(): Product {
        return new ConcreteProductB();
    }
}

// Usage
const creatorA = new ConcreteCreatorA();
console.log(creatorA.someOperation());

const creatorB = new ConcreteCreatorB();
console.log(creatorB.someOperation());
```
