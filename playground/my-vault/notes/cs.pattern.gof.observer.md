---
id: rfizwmd301ktdrr7km8dl7c
title: Observer
desc: 'Explanation of the Observer pattern'
updated: 1743410680280
created: 1743281626982
---
The Observer pattern defines a one-to-many relationship between objects so that when one state changes, all dependent objects are notified and updated automatically.

## Features

- **Decoupling**: The subject and observers are independent.
- **Automatic Notification**: Observers are updated as soon as the subject's state changes.

## Implementation

A subject maintains a list of observers and for each change sends a notification to all subscribers.

![image](./assets/images/2025-03-31-10-26-39.png)

## Example

This example shows how to implement the Observer pattern in TypeScript.  
The subject notifies a list of observers every time its state changes.

```typescript
// Interface for observers
interface Observer {
    update(message: string): void;
}

// Subject class that maintains observers
class Subject {
    private observers: Observer[] = [];

    subscribe(observer: Observer): void {
        this.observers.push(observer);
    }

    unsubscribe(observer: Observer): void {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notify(message: string): void {
        this.observers.forEach(observer => observer.update(message));
    }
}

// Concrete implementation of an observer
class ConcreteObserver implements Observer {
    update(message: string): void {
        console.log(`Message received: ${message}`);
    }
}

// Usage
const subject = new Subject();
const observer1 = new ConcreteObserver();
subject.subscribe(observer1);
subject.notify("Hello everyone!");
```
