import { BrandTemplate } from './types';

export const brandTemplates: BrandTemplate[] = [
  {
    id: 'minimal-tech',
    name: 'Minimal Tech',
    description: 'Clean, sophisticated, Apple-inspired',
    preview: {
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#0071e3',
      },
      tone: {
        minimal: 85,
        playful: 20,
        bold: 60,
        experimental: 30,
      },
      keywords: ['innovative', 'simple', 'premium', 'seamless', 'intuitive'],
      doPatterns: [
        'Use short, impactful sentences',
        'Focus on benefits, not features',
        'Speak directly to the user',
        'Use present tense',
      ],
      dontPatterns: [
        'Avoid technical jargon',
        'No exclamation marks',
        'Avoid superlatives like "best" or "amazing"',
        'No corporate buzzwords',
      ],
      voiceSamples: [
        'Think different.',
        'The best experiences are the ones you don\'t notice.',
        'Privacy. That\'s iPhone.',
      ],
    },
  },
  {
    id: 'bold-athletic',
    name: 'Bold Athletic',
    description: 'Energetic, motivational, Nike-inspired',
    preview: {
      colors: {
        primary: '#111111',
        secondary: '#ffffff',
        accent: '#ff6b00',
      },
      tone: {
        minimal: 40,
        playful: 50,
        bold: 95,
        experimental: 60,
      },
      keywords: ['power', 'drive', 'unstoppable', 'champion', 'push', 'limits'],
      doPatterns: [
        'Use action verbs',
        'Create urgency and momentum',
        'Speak to the athlete in everyone',
        'Be inspirational and empowering',
      ],
      dontPatterns: [
        'Avoid passive voice',
        'No weak or hesitant language',
        'Avoid lengthy explanations',
        'No negative framing',
      ],
      voiceSamples: [
        'Just do it.',
        'There is no finish line.',
        'Yesterday you said tomorrow.',
      ],
    },
  },
  {
    id: 'friendly-startup',
    name: 'Friendly Startup',
    description: 'Approachable, conversational, Slack-inspired',
    preview: {
      colors: {
        primary: '#4a154b',
        secondary: '#ffffff',
        accent: '#36c5f0',
      },
      tone: {
        minimal: 30,
        playful: 80,
        bold: 45,
        experimental: 55,
      },
      keywords: ['easy', 'together', 'friendly', 'smart', 'helpful', 'human'],
      doPatterns: [
        'Use conversational tone',
        'Include light humor when appropriate',
        'Explain complex things simply',
        'Be helpful and supportive',
      ],
      dontPatterns: [
        'Avoid formal corporate language',
        'No condescending tone',
        'Avoid overused startup jargon',
        'No aggressive sales language',
      ],
      voiceSamples: [
        'Work happens in Slack.',
        'Finally, all your team communication in one place.',
        'Less email. More doing.',
      ],
    },
  },
  {
    id: 'luxury-premium',
    name: 'Luxury Premium',
    description: 'Elegant, exclusive, high-end fashion inspired',
    preview: {
      colors: {
        primary: '#1a1a1a',
        secondary: '#f5f5f0',
        accent: '#c9a96e',
      },
      tone: {
        minimal: 90,
        playful: 10,
        bold: 50,
        experimental: 40,
      },
      keywords: ['exclusive', 'crafted', 'timeless', 'heritage', 'refined', 'artisan'],
      doPatterns: [
        'Use elegant, sophisticated language',
        'Emphasize craftsmanship and quality',
        'Create sense of exclusivity',
        'Use evocative, sensory descriptions',
      ],
      dontPatterns: [
        'Avoid casual or slang terms',
        'No discount or sale language',
        'Avoid urgency tactics',
        'No over-explanation',
      ],
      voiceSamples: [
        'Crafted for those who appreciate the finer things.',
        'Where heritage meets innovation.',
        'Excellence is not an act, but a habit.',
      ],
    },
  },
  {
    id: 'playful-creative',
    name: 'Playful Creative',
    description: 'Fun, quirky, Mailchimp-inspired',
    preview: {
      colors: {
        primary: '#241c15',
        secondary: '#ffe01b',
        accent: '#ff6b6b',
      },
      tone: {
        minimal: 25,
        playful: 95,
        bold: 60,
        experimental: 85,
      },
      keywords: ['fun', 'creative', 'quirky', 'delightful', 'surprising', 'fresh'],
      doPatterns: [
        'Use puns and wordplay',
        'Add unexpected touches of humor',
        'Be warm and personable',
        'Celebrate creativity',
      ],
      dontPatterns: [
        'Avoid boring corporate speak',
        'No dry or technical language',
        'Avoid being too serious',
        'No generic phrases',
      ],
      voiceSamples: [
        'High fives! Your campaign is on its way.',
        'We\'re here to help you grow. Seriously.',
        'Email marketing that doesn\'t suck.',
      ],
    },
  },
  {
    id: 'trustworthy-finance',
    name: 'Trustworthy Finance',
    description: 'Reliable, clear, banking-inspired',
    preview: {
      colors: {
        primary: '#003d6b',
        secondary: '#ffffff',
        accent: '#00a0df',
      },
      tone: {
        minimal: 70,
        playful: 15,
        bold: 40,
        experimental: 15,
      },
      keywords: ['secure', 'trusted', 'transparent', 'reliable', 'smart', 'simple'],
      doPatterns: [
        'Be clear and straightforward',
        'Explain without condescending',
        'Build trust through transparency',
        'Use reassuring language',
      ],
      dontPatterns: [
        'Avoid complex financial jargon',
        'No misleading or vague promises',
        'Avoid aggressive upselling',
        'No anxiety-inducing language',
      ],
      voiceSamples: [
        'Banking that puts you first.',
        'Your money, your way.',
        'Simple, secure, straightforward.',
      ],
    },
  },
];

export const contentTypeLabels: Record<string, { label: string; description: string; placeholder: string }> = {
  'general': {
    label: 'General',
    description: 'Any type of content',
    placeholder: 'Describe what you need...',
  },
  'social-twitter': {
    label: 'Twitter/X Post',
    description: 'Short, punchy, 280 characters',
    placeholder: 'What should the tweet be about?',
  },
  'social-linkedin': {
    label: 'LinkedIn Post',
    description: 'Professional, thought leadership',
    placeholder: 'What topic or insight to share?',
  },
  'social-instagram': {
    label: 'Instagram Caption',
    description: 'Visual, engaging, hashtag-friendly',
    placeholder: 'Describe the image or topic...',
  },
  'headline': {
    label: 'Headline',
    description: 'Attention-grabbing title',
    placeholder: 'What is the headline for?',
  },
  'tagline': {
    label: 'Tagline/Slogan',
    description: 'Memorable brand phrase',
    placeholder: 'What product or campaign?',
  },
  'email-subject': {
    label: 'Email Subject Line',
    description: 'Click-worthy, concise',
    placeholder: 'What is the email about?',
  },
  'email-body': {
    label: 'Email Body',
    description: 'Full email content',
    placeholder: 'Purpose and key points of the email?',
  },
  'ad-copy': {
    label: 'Ad Copy',
    description: 'Persuasive advertising text',
    placeholder: 'What are you advertising?',
  },
  'product-description': {
    label: 'Product Description',
    description: 'Compelling product details',
    placeholder: 'Describe the product...',
  },
  'blog-intro': {
    label: 'Blog Introduction',
    description: 'Engaging opening paragraph',
    placeholder: 'What is the blog post about?',
  },
};

