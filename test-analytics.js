// Test script to verify analytics fixes
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function testAnalytics() {
  console.log('🔍 Testing Analytics Endpoints...\n');
  
  try {
    // Test 1: Basic analytics activity
    console.log('1. Testing basic analytics activity...');
    const activityResponse = await makeRequest('http://localhost:5000/api/analytics/activity');
    console.log('✅ Activity endpoint:', activityResponse.status, 'data length:', activityResponse.data.length || 'N/A');
    
    // Test 2: Performance analytics
    console.log('2. Testing performance analytics...');
    const performanceResponse = await makeRequest('http://localhost:5000/api/analytics/performance');
    console.log('✅ Performance endpoint:', performanceResponse.status, 'data length:', performanceResponse.data.length || 'N/A');
    
    // Test 3: Debug organization data (without auth)
    console.log('3. Testing organization debug data...');
    const orgDebugResponse = await makeRequest('http://localhost:5000/api/analytics/debug/Science%20Institute');
    if (orgDebugResponse.status === 200) {
      console.log('✅ Organization debug data:');
      console.log(`   - Users: ${orgDebugResponse.data.users}`);
      console.log(`   - Teachers: ${orgDebugResponse.data.teachers}`);
      console.log(`   - Teacher Docs: ${orgDebugResponse.data.teacherDocs}`);
      console.log(`   - Tests: ${orgDebugResponse.data.tests}`);
      console.log(`   - Results: ${orgDebugResponse.data.results}`);
      
      if (orgDebugResponse.data.sampleTest) {
        console.log(`   - Sample Test: ${orgDebugResponse.data.sampleTest.name}`);
      }
    } else {
      console.log('❌ Organization debug failed:', orgDebugResponse.status);
    }
    
    console.log('\n🎉 Analytics endpoints tested!');
    console.log('\n📊 Ready to test in browser:');
    console.log('   1. Login to admin panel');
    console.log('   2. Go to Organizations tab');
    console.log('   3. Click on "Science Institute" organization');
    console.log('   4. Check analytics graphs');
    
  } catch (error) {
    console.error('❌ Error testing analytics:', error.message);
  }
}

testAnalytics();