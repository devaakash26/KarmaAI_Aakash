import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

const MODEL = 'openai/gpt-3.5-turbo';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { prompt, code, selectedElement } = await request.json();
  if (!prompt || !code || !selectedElement) {
    return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
  }

  const systemPrompt = `You are an expert React/Tailwind developer. A user will give instructions to modify a specific element inside a React component. You'll receive three JSON fields:\n1. fullCode: the entire component code (string)\n2. elementHTML: outer HTML of the selected element (string)\n3. instruction: user instruction (string)\n\nYour job: return ONLY the updated full component code after applying the instruction to that element. Do not change unrelated parts. Do not add any commentary.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: JSON.stringify({
        fullCode: code,
        elementHTML: selectedElement.outerHTML || '',
        instruction: prompt,
      }),
    },
  ];

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens: 800 }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ message: data.error?.message || 'AI error' }, { status: 500 });
    }

    const aiMessage = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ code: aiMessage.trim() });
  } catch (e) {
    console.error('Override error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
} 