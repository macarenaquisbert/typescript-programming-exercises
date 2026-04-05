function checkAge(name: string, age: number): string {
  // your code here
  if (age >= 21) {
    return "Welcome, " + name + "!";
  } else {
    return "Go home, " + name + "!";
  }
}

export {};