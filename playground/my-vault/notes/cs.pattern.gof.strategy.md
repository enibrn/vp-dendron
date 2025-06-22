---
id: rxsx526wo5berg9f3knlr46
title: Strategy
desc: ''
updated: 1743410749934
created: 1743281672486
---
The Strategy pattern allows you to define a family of algorithms, encapsulate them, and make them interchangeable. The behavior of the algorithm can be changed independently from the clients that use it.

## Features

- **Interchangeability**: Algorithms can be dynamically replaced.
- **Isolation**: The algorithm is separated from the context in which it is used.

## Implementation

A common interface is defined for all algorithms, and each algorithm is implemented in a separate class that follows this interface.

## Strategy and DI

Here is a summary of the differences between Strategy and [[cs.pattern.dep-inj]]

- **Purpose:**  
  - *Strategy* is a pattern that encapsulates a family of algorithms and allows them to be changed dynamically to vary the context's behavior at runtime.  
  - *Dependency Injection* is a technique for providing dependencies to a component from the outside, reducing coupling and facilitating testing.

- **Runtime Modification:**  
  - With *Strategy*, the algorithm can be altered during execution (e.g., via a setter).  
  - With *DI*, dependencies (like a Logger) are usually injected at construction time and are not meant to be changed at runtime.

- **Scope of Use:**  
  - *Strategy* focuses on the dynamic selection of behaviors in specific contexts.  
  - *DI* is a more general principle that can be applied to inject any type of dependency, making the system more modular and testable.

In summary, while both reduce coupling, the Strategy pattern focuses on the interchangeability of algorithms, while Dependency Injection deals with providing an object's dependencies in a flexible and externalized way.

## Example

This example implements the Strategy pattern in TypeScript.  
We define a family of algorithms by encapsulating them and making them interchangeable at runtime.

```typescript
// Interface that defines the method for algorithms
interface Strategy {
    doAlgorithm(data: number[]): number[];
}

// Concrete implementations of the algorithms
class ConcreteStrategyAdd implements Strategy {
    doAlgorithm(data: number[]): number[] {
        return data.map(x => x + 1);
    }
}

class ConcreteStrategyMultiply implements Strategy {
    doAlgorithm(data: number[]): number[] {
        return data.map(x => x * 2);
    }
}

// Context that uses a strategy
class Context {
    private strategy: Strategy;
    
    constructor(strategy: Strategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: Strategy): void {
        this.strategy = strategy;
    }

    executeStrategy(data: number[]): number[] {
        return this.strategy.doAlgorithm(data);
    }
}

// Usage
const context = new Context(new ConcreteStrategyAdd());
console.log(context.executeStrategy([1, 2, 3])); // Output: [2, 3, 4]

context.setStrategy(new ConcreteStrategyMultiply());
console.log(context.executeStrategy([1, 2, 3])); // Output: [2, 4, 6]
```
