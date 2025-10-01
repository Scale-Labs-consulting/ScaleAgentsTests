#!/usr/bin/env node

/**
 * Setup script for Sales Analyst OpenAI Assistant
 * 
 * This script:
 * 1. Creates/updates the Sales Analyst assistant
 * 2. Sets up the environment variable
 * 3. Tests the assistant functionality
 */

require('dotenv').config({ path: '.env.local' });

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function setupSalesAnalystAssistant() {
  console.log('🚀 Setting up Sales Analyst Assistant...\n');

  try {
    // Step 1: Create/update the assistant
    console.log('📝 Creating/updating Sales Analyst assistant...');
    const setupResponse = await fetch(`${API_BASE_URL}/api/sales-analyst/setup-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!setupResponse.ok) {
      const errorText = await setupResponse.text();
      throw new Error(`Setup failed: ${setupResponse.status} - ${errorText}`);
    }

    const setupResult = await setupResponse.json();
    console.log('✅ Assistant setup completed:');
    console.log(`   - Assistant ID: ${setupResult.assistantId}`);
    console.log(`   - Assistant Name: ${setupResult.assistantName}`);
    console.log(`   - Tools: ${setupResult.tools}\n`);

    // Step 2: Generate environment variable update
    console.log('🔧 Environment Variable Setup:');
    console.log('Add this line to your .env.local file:');
    console.log(`SALES_ANALYST_ASSISTANT_ID=${setupResult.assistantId}\n`);

    // Step 3: Test the assistant (optional)
    console.log('🧪 Testing assistant functionality...');
    try {
      const testResponse = await fetch(`${API_BASE_URL}/api/sales-analyst/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'get_sales_knowledge',
          parameters: {
            callType: 'Chamada Fria',
            focusArea: 'general'
          }
        })
      });

      if (testResponse.ok) {
        console.log('✅ Assistant tools are working correctly\n');
      } else {
        console.log('⚠️ Assistant tools test failed (this is normal if no sales calls exist yet)\n');
      }
    } catch (testError) {
      console.log('⚠️ Assistant tools test failed (this is normal if no sales calls exist yet)\n');
    }

    // Step 4: Instructions for next steps
    console.log('📋 Next Steps:');
    console.log('1. Add the environment variable to your .env.local file');
    console.log('2. Restart your development server');
    console.log('3. Test with a real sales call analysis');
    console.log('4. Monitor the analysis quality improvements\n');

    console.log('🎉 Sales Analyst Assistant setup completed successfully!');
    console.log('The assistant is now ready to provide high-quality, consistent sales call analyses.');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupSalesAnalystAssistant();
