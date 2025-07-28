import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// Default model to use if none specified
const DEFAULT_MODEL = 'openai/gpt-3.5-turbo';

// Available models and their token limits
const MODEL_CONFIGS = {
  'openai/gpt-3.5-turbo': { maxTokens: 500 },
  'openai/gpt-4o': { maxTokens: 500 },
  'anthropic/claude-3-haiku': { maxTokens: 400 },
  'google/gemini-pro': { maxTokens: 400 }
};

// Add this function to fetch available models
async function getAvailableModels(apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching models:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get prompt, chat history, and model from request body
    const { prompt, chatHistory = [], model = DEFAULT_MODEL } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get model configuration or use default
    const modelConfig = MODEL_CONFIGS[model] || MODEL_CONFIGS[DEFAULT_MODEL];

    // Format chat history for the API - limit to just the last message to save tokens
    const formattedChatHistory = chatHistory.length > 0 
      ? [chatHistory[chatHistory.length - 1]].map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      : [];

    // Prepare the system prompt - simplified to reduce tokens
    const systemPrompt = `
      You are an AI that generates React components with Tailwind CSS.
      Create components based on user descriptions.
      Use functional components, Tailwind CSS classes, and make them responsive.
      Include brief comments for clarity.
      Return a brief message and the complete code.
    `;

    // Prepare the messages array for the API
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...formattedChatHistory
    ];

    // Add the user's prompt
    messages.push({
      role: 'user',
      content: `Generate a React component with Tailwind CSS: "${prompt}"`
    });

    console.log(`Calling OpenRouter API with model: ${model}`);

    // Call OpenRouter API with the selected model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'KarmaAI Component Generator'
      },
      body: JSON.stringify({
        model: model,
        messages,
        temperature: 0.7,
        max_tokens: modelConfig.maxTokens
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      
      // If the error is about an invalid model, try to fetch available models
      let availableModels = null;
      if (errorData?.error?.message?.includes('not a valid model ID')) {
        availableModels = await getAvailableModels(process.env.OPENROUTER_API_KEY);
        console.log('Available models:', availableModels ? availableModels.map(m => m.id) : 'None found');
      }
      
      // Return a more specific error message to the client
      return NextResponse.json(
        { 
          error: 'API Error', 
          message: errorData?.error?.message || 'Failed to generate code',
          code: errorData?.error?.code,
          availableModels: availableModels ? availableModels.map(m => m.id) : undefined
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();

    // Extract the code and message from the AI response
    let code = '';
    let message = '';

    // Check if the response contains code
    const codeBlockRegex = /```(?:jsx|javascript|react|js|tsx|typescript)?\s*([\s\S]*?)```/;
    const codeMatch = aiResponse.match(codeBlockRegex);

    if (codeMatch) {
      // Extract code from code block
      code = codeMatch[1].trim();
      
      // Extract message (everything before the first code block)
      const messageParts = aiResponse.split(codeBlockRegex);
      message = messageParts[0].trim();
    } else {
      // If no code block is found, try to identify if the entire response is code
      if (aiResponse.includes('import React') || 
          aiResponse.includes('function') || 
          aiResponse.includes('const') && 
          aiResponse.includes('return')) {
        code = aiResponse;
        message = "Here's the component you requested.";
      } else {
        // If it doesn't look like code, treat it as a message
        message = aiResponse;
        code = "// No code was generated. Please try a different prompt.";
      }
    }

    return NextResponse.json({ 
      code, 
      message,
      model
    });
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json(
      { error: 'Failed to generate code', message: error.message },
      { status: 500 }
    );
  }
} 