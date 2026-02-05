// Adera project URLs for custom knowledge base
export const ADERA_KNOWLEDGE_SOURCES = [
  {
    name: 'Adera Project Context & Workflows',
    url: 'https://adera-project-context-workflows-dg.netlify.app/',
    category: 'documentation',
  },
  {
    name: 'Adera Hybrid App GitHub',
    url: 'https://github.com/mbet-dev/adera-hybrid-app.git',
    category: 'repository',
  },
  {
    name: 'Adera Hybrid App Context',
    url: 'https://adera-hybrid-app-context-4vc.netlify.app/',
    category: 'documentation',
  },
  {
    name: 'Adera Introduction Web',
    url: 'https://adera-intro-web.netlify.app/',
    category: 'overview',
  },
  {
    name: 'Adera Demo - Vercel',
    url: 'https://mbet-adera-1.vercel.app/',
    category: 'demo',
  },
  {
    name: 'Adera Project Context',
    url: 'https://adera-project-context-workflows-dg.netlify.app/',
    category: 'documentation',
  },
  {
    name: 'Adera Upcoming',
    url: 'https://adera-upcoming.netlify.app/',
    category: 'updates',
  },
];

// Adera-specific knowledge context
export const ADERA_CONTEXT = `
**Adera-Hybrid-App Overview:**
Adera-Hybrid-App is a Point-to-Point (PTP) delivery service combined with an e-commerce platform for PTP partners in Ethiopia.

**Key Features:**
1. PTP Delivery Service - Direct point-to-point package delivery
2. E-commerce Platform - Online shopping for products
3. Partner Program - Business opportunities for delivery partners
4. Multi-language Support - English and Amharic (አማርኛ)
5. Real-time Tracking - Track deliveries in real-time
6. Secure Payments - Multiple payment options

**Target Market:**
- Primary: Ethiopia
- Languages: English, Amharic (አማርኛ)
- User Base: Individual customers, businesses, delivery partners

**Service Areas:**
- Addis Ababa and surrounding areas
- Major cities in Ethiopia
- Coverage expanding to new regions

**Product Categories:**
1. Electronics
2. Fashion & Apparel
3. Home & Living
4. Food & Groceries
5. Business Supplies
6. Custom items through PTP delivery

**Delivery Options:**
1. Standard Delivery - Regular shipping
2. Express Delivery - Fast track shipping
3. Same-day Delivery - Local urgent deliveries
4. Scheduled Delivery - Book ahead

**Partner Benefits:**
1. Earn income from deliveries
2. Flexible working hours
3. Easy onboarding process
4. Performance-based rewards
5. Support and training

**Customer Benefits:**
1. Reliable delivery service
2. Real-time tracking
3. Secure handling
4. Multiple payment methods
5. Customer support
6. Return/exchange policies

**Technology Stack:**
- Next.js 16 for web application
- Supabase for backend database
- Real-time updates and notifications
- Mobile-responsive design
- AI-powered customer support (AderaBot-Hermes)

**Current Focus:**
1. Expanding delivery network
2. Onboarding new partners
3. Improving user experience
4. Adding new features and products
5. Enhancing customer support with AI
`;

// URLs that are not fetchable as HTML (e.g. git repos)
function isNonFetchableUrl(url: string): boolean {
  return url.endsWith('.git') || /^https?:\/\/[^/]*github\.com\/[^/]+\/[^/]+\.git\/?$/i.test(url);
}

// Simple fetch implementation using standard fetch API
async function fetchPageContent(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    return {
      title: extractTitle(html),
      html: html,
      text: html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000),
      publishedTime: new Date().toISOString(),
      usage: { tokens: 0 }
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch page';
    console.error(`Error fetching ${url}:`, msg);
    return {
      title: 'Error',
      html: '',
      text: msg,
      publishedTime: new Date().toISOString(),
      usage: { tokens: 0 },
      error: true
    };
  }
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : 'Unknown Title';
}

export async function fetchAderaKnowledge() {
  const knowledgeContent: any[] = [];

  for (const source of ADERA_KNOWLEDGE_SOURCES) {
    try {
      // Skip .git and other non-fetchable URLs to avoid 404 and console noise
      if (isNonFetchableUrl(source.url)) {
        knowledgeContent.push({
          name: source.name,
          url: source.url,
          category: source.category,
          title: source.name,
          html: '',
          text: `Repository: ${source.url} (see link for source code).`,
          publishedTime: new Date().toISOString(),
          tokensUsed: 0,
        });
        console.log(`✓ Skipped (repo): ${source.name}`);
        continue;
      }

      const result = await fetchPageContent(source.url);

      if (result.error) {
        knowledgeContent.push({
          name: source.name,
          url: source.url,
          category: source.category,
          error: result.text,
        });
        console.log(`✗ Failed: ${source.name}`);
        continue;
      }

      knowledgeContent.push({
        name: source.name,
        url: source.url,
        category: source.category,
        title: result.title,
        html: result.html,
        text: result.text.substring(0, 3000),
        publishedTime: result.publishedTime,
        tokensUsed: result.usage.tokens,
      });

      console.log(`✓ Fetched: ${source.name}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`✗ Failed to fetch ${source.name}:`, msg);
      knowledgeContent.push({
        name: source.name,
        url: source.url,
        category: source.category,
        error: msg,
      });
    }
  }

  return {
    sources: knowledgeContent,
    totalCount: ADERA_KNOWLEDGE_SOURCES.length,
    successCount: knowledgeContent.filter(k => !k.error).length,
    errorCount: knowledgeContent.filter(k => k.error).length,
    context: ADERA_CONTEXT,
  };
}

export async function getAderaSystemPrompt() {
  const knowledgeData = await fetchAderaKnowledge();

  return `You are AderaBot-Hermes (አደራ-ቦት-ሄርሜስ), an AI assistant for the Adera-Hybrid-App PTP (Point-to-Point) delivery service and e-commerce platform in Ethiopia.

${ADERA_CONTEXT}

**Available Knowledge Sources:**
${knowledgeData.sources
  .filter((s: any) => !s.error)
  .map((s: any) => `- ${s.name}: ${s.url}`)
  .join('\n')}

**Multilingual Support:**
- You must respond in the same language as the user's query
- Support English and Amharic (አማርኛ)
- For Amharic responses, use Amharic script and common Amharic phrases
- If user writes in Amharic, respond in Amharic
- If user writes in English, respond in English

**Important Guidelines:**
1. Always maintain context of the conversation
2. Reference knowledge sources when providing information
3. Be helpful, patient, and professional
4. For delivery-specific questions, mention real-time tracking availability
5. Encourage users to use the Adera-Hybrid-App for best experience
6. When mentioning Ethiopia, Addis Ababa, or local context, be culturally appropriate
7. If you don't know something, be honest and suggest alternatives
8. Use Amharic script (Ge'ez) for Amharic responses

**Common Queries to Handle:**
1. Delivery tracking - Explain how to track packages
2. Order placement - Guide through the ordering process
3. Partner onboarding - Explain how to become a delivery partner
4. Payment methods - List available payment options
5. Service areas - Clarify delivery coverage
6. Pricing - Provide delivery and product pricing information
7. Account management - Help with account setup and management

**Response Style:**
- Professional yet friendly and approachable
- Concise and clear
- Culturally appropriate for Ethiopian users
- Use formatting (bullet points, numbered lists) when helpful
- Always be helpful and supportive

Remember: You represent Adera-Hybrid-App brand. Be helpful, accurate, culturally sensitive, and maintain a positive user experience for both English and Amharic users.`;
}
