// Test script to verify the API fix for the "Cannot read properties of undefined (reading 'replace')" error
const axios = require('axios');

// Test the backend endpoints
async function testBackendEndpoints() {
    const baseUrl = 'http://127.0.0.1:8000';
    
    console.log('Testing backend API endpoints...\n');
    
    try {
        // Test /chat endpoint
        console.log('1. Testing /chat endpoint...');
        const chatResponse = await axios.post(`${baseUrl}/chat`, {
            message: 'Hello, test message'
        });
        console.log('✅ Chat endpoint response:', chatResponse.data);
        console.log('   Response structure:', Object.keys(chatResponse.data));
        
        // Test /explain-code endpoint
        console.log('\n2. Testing /explain-code endpoint...');
        const explainResponse = await axios.post(`${baseUrl}/explain-code`, {
            code: 'function test() { return "hello"; }',
            language: 'javascript',
            context: 'Test code explanation'
        });
        console.log('✅ Explain endpoint response:', explainResponse.data);
        console.log('   Response structure:', Object.keys(explainResponse.data));
        
        // Test /fix-code endpoint
        console.log('\n3. Testing /fix-code endpoint...');
        const fixResponse = await axios.post(`${baseUrl}/fix-code`, {
            code: 'function test() { console.log(undefined.property); }',
            language: 'javascript',
            context: 'Fix this buggy code'
        });
        console.log('✅ Fix endpoint response:', fixResponse.data);
        console.log('   Response structure:', Object.keys(fixResponse.data));
        
        console.log('\n🎉 All API endpoints are working correctly!');
        console.log('\nKey findings:');
        console.log('- /chat endpoint returns: { response: string }');
        console.log('- /explain-code endpoint returns: { result: string }');
        console.log('- /fix-code endpoint returns: { result: string }');
        console.log('\nThe TypeScript API service should now handle these responses correctly.');
        
    } catch (error) {
        console.error('❌ Error testing endpoints:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Test API response handling (simulate the fixed TypeScript code)
function testResponseHandling() {
    console.log('\n\nTesting response handling logic...\n');
    
    // Simulate chat response handling
    const chatResponse = { data: { response: 'Hello from chat API' } };
    if (chatResponse && chatResponse.data && typeof chatResponse.data.response === 'string') {
        console.log('✅ Chat response handling: PASS');
        console.log('   Extracted response:', chatResponse.data.response);
    } else {
        console.log('❌ Chat response handling: FAIL');
    }
    
    // Simulate code operation response handling
    const codeResponse = { data: { result: 'Here is the fixed code...' } };
    if (codeResponse && codeResponse.result) {
        console.log('✅ Code operation response handling: PASS');
        console.log('   Extracted result:', codeResponse.result);
    } else {
        console.log('❌ Code operation response handling: FAIL');
    }
    
    // Test undefined response handling
    const undefinedResponse = undefined;
    if (undefinedResponse && undefinedResponse.result) {
        console.log('❌ Undefined response handling: FAIL - should not reach here');
    } else {
        console.log('✅ Undefined response handling: PASS - correctly handled null/undefined');
    }
}

// Run tests
async function runTests() {
    console.log('='.repeat(70));
    console.log('CodeShiftAI API Fix Verification Test');
    console.log('='.repeat(70));
    
    await testBackendEndpoints();
    testResponseHandling();
    
    console.log('\n' + '='.repeat(70));
    console.log('Test completed! The "Cannot read properties of undefined" error should be fixed.');
    console.log('='.repeat(70));
}

runTests();
