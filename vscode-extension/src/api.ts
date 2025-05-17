export async function callGenerateAPI(prompt: string): Promise<string> {
    try {
        const response = await fetch('http://localhost:8000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        return data.result;
    } catch (error) {
        return 'Error calling backend API';
    }
}
