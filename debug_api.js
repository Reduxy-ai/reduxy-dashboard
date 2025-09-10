// Simple test script to debug API issues
const testProfile = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid-token'  // This will fail, but let's see the error
            },
            body: JSON.stringify({
                firstName: 'Test',
                lastName: 'User',
                company: 'Test Company'
            })
        })

        const data = await response.json()
        console.log('Response:', response.status, data)
    } catch (error) {
        console.error('Fetch error:', error)
    }
}

testProfile() 