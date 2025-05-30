// CodeShiftAI Extension Demo File
// This file demonstrates the various features of the CodeShiftAI extension

// 1. Try using code completion - start typing and see AI suggestions
function calculateSum(a: number, b: number) {
    // Type here to see completions...
    
}

// 2. Select the code below and use Ctrl+Shift+E to explain it
class UserManager {
    private users: User[] = [];
    
    addUser(user: User): void {
        this.users.push(user);
    }
    
    findUser(id: string): User | undefined {
        return this.users.find(u => u.id === id);
    }
}

// 3. Select this function and use Ctrl+Shift+F to get suggestions for fixing/improving it
function processData(data) {
    if (!data) return;
    
    let result = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].active) {
            result.push(data[i].value * 2);
        }
    }
    return result;
}

// 4. Select this code and use Ctrl+Shift+O to optimize it
function inefficientSearch(array: number[], target: number): boolean {
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length; j++) {
            if (array[i] === target) {
                return true;
            }
        }
    }
    return false;
}

// 5. Select this function and use Ctrl+Shift+T to generate unit tests
function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 6. Select this interface and use Ctrl+Shift+D to generate documentation
interface User {
    id: string;
    name: string;
    email: string;
    active: boolean;
    createdAt: Date;
}

// 7. Use the chat panel (Ctrl+Shift+C) and try slash commands:
// /explain - Explain any code you're working on
// /fix - Get suggestions to fix problematic code
// /optimize - Get performance optimization tips
// /test - Generate unit tests for your functions
// /docs - Generate documentation for your code
// /refactor - Get refactoring suggestions
// /review - Get a code review of your work

// 8. Right-click on any code selection to see context menu options

export { UserManager, validateEmail, processData, inefficientSearch };
