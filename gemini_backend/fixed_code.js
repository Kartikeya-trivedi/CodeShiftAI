function test() {
  let myVar; // Declare a variable, but it's initially undefined

  if (myVar !== undefined && myVar !== null) {
    // Check if myVar is defined and not null
    console.log(myVar.property); // Access the property if myVar is valid
  } else {
    console.log("myVar is undefined or null"); // Handle the case where myVar is not valid
  }
}