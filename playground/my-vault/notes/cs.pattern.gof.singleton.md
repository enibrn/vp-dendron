---
id: p20cj84adi8lopiu8e0z5gw
title: Singleton
desc: 'Explanation of the Singleton pattern'
updated: 1743410693696
created: 1743281518785
---
The Singleton pattern ensures that a class has only one instance and provides a global access point to it. This is useful when it is necessary to coordinate access to a shared resource.

## Features

- **Single Instance**: Only one instance of the class is created during the application's lifecycle.
- **Global Access Control**: The instance is accessible everywhere.

## Implementation

The instance is created only once, often using a lazy or eager mechanism.

## Example

This example shows how to implement the Singleton pattern in TypeScript.  
The class ensures that only one instance is created and provides a global access point.

```typescript
class Singleton {
    private static instance: Singleton;
    
    // Private constructor to prevent multiple instantiations
    private constructor() {}

    public static getInstance(): Singleton {
        if (!Singleton.instance) {
            Singleton.instance = new Singleton();
        }
        return Singleton.instance;
    }

    public someMethod(): void {
        console.log("Method called on the Singleton instance.");
    }
}

// Usage
const s1 = Singleton.getInstance();
s1.someMethod();
```
