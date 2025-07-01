---
id: pnk0jqy96274fl9z5exjblr
title: Dependency Injection
desc: Explanation of the concept of Dependency Injection
updated: 1751375569526
created: 1743281333601
tags:
  - modularity
vpd:
  ogdate: '2022-12-23'
---
Dependency Injection (DI) is a design pattern that promotes the separation between the creation of dependencies and their usage. Essentially, components do not create their own dependencies, but receive them from the outside, thus improving modularity and testability.

## Advantages of Dependency Injection

- **Modularity**: Encourages the creation of independent and easily replaceable components.
- **Testability**: Allows injecting mock or stub versions during testing.
- **Maintainability**: Reduces direct coupling, making code easier to maintain and extend.

## How it works

Instead of instantiating classes directly within a component, dependencies are passed as parameters (through constructors, methods, or properties) from an external context, such as a DI container. This approach increases flexibility and the ability to test individual parts in isolation.

## Example

Imagine a controller that needs to access a logging service. With Dependency Injection, the controller receives the already created service, without handling its instantiation itself.

With this pattern, the code is clearer, easier to manage, and modify over time.

## TypeScript Implementation

In this example, we see how to implement Dependency Injection in TypeScript using a simple scenario.

Imagine a logging service that wants to be reusable in different components. Instead of creating the logger directly inside the component, we inject it via the constructor.

```typescript
// Definition of the interface for the logger
interface ILogger {
    log(message: string): void;
}

// Concrete implementation of the logger that writes to the console
class ConsoleLogger implements ILogger {
    log(message: string): void {
        console.log('Logs:', message);
    }
}

// Service that depends on the logger
class UserService {
    private logger: ILogger;

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    getUser(id: number): void {
        this.logger.log(`Fetching user with id ${id}`);
        // ...logic to retrieve the user...
    }
}

// Creation of the logger instance and injection into the service
const logger = new ConsoleLogger();
const userService = new UserService(logger);

// Using the service
userService.getUser(1);
```

## Explanation

- **ILogger interface**: Defines the contract for any implementation of a logging component.
- **ConsoleLogger**: Implements ILogger and provides logging logic (in this case, writing to the console).
- **UserService**: Receives an instance of ILogger via the constructor, making the service independent from the specific logger implementation.
- **Dependency injection**: The `ConsoleLogger` instance is created separately and passed to `UserService`, thus allowing greater modularity and easier testing.

This approach makes it easy to replace `ConsoleLogger` with another implementation of `ILogger` for tests or different production scenarios.
