import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA, VisualConcept, GeneratedContentItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, visualConcepts, generatedContent } = await request.json() as {
      brandDNA: BrandDNA;
      visualConcepts: VisualConcept[];
      generatedContent: GeneratedContentItem[];
    };

    if (!brandDNA?.name) {
      return NextResponse.json({ error: 'Missing brand DNA' }, { status: 400 });
    }

    // Generate HTML for the brand kit
    const html = generateBrandKitHTML(brandDNA, visualConcepts || [], generatedContent || []);

    return NextResponse.json({ html });

  } catch (error) {
    console.error('Brand kit generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

function generateBrandKitHTML(
  brand: BrandDNA,
  concepts: VisualConcept[],
  content: GeneratedContentItem[]
): string {
  const approvedContent = content.filter((c) => c.approved);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Generate tone descriptions
  const getToneDescription = (value: number, low: string, high: string) => {
    if (value < 30) return `Strongly ${low}`;
    if (value < 45) return `Moderately ${low}`;
    if (value > 70) return `Strongly ${high}`;
    if (value > 55) return `Moderately ${high}`;
    return 'Balanced';
  };

  const toneDescriptions = {
    minimal: getToneDescription(brand.tone.minimal, 'elaborate', 'minimal'),
    playful: getToneDescription(brand.tone.playful, 'serious', 'playful'),
    bold: getToneDescription(brand.tone.bold, 'subtle', 'bold'),
    experimental: getToneDescription(brand.tone.experimental, 'classic', 'experimental'),
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${brand.name} Brand Kit</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --brand-primary: ${brand.colors.primary};
      --brand-secondary: ${brand.colors.secondary};
      --brand-accent: ${brand.colors.accent};
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #000;
      color: #fff;
      line-height: 1.6;
      font-size: 14px;
    }
    
    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.6in;
      page-break-after: always;
      background: #000;
      position: relative;
    }
    
    .page-number {
      position: absolute;
      bottom: 0.4in;
      right: 0.6in;
      font-size: 11px;
      color: #555;
    }
    
    /* Cover Page */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 10in;
      background: linear-gradient(180deg, var(--brand-primary) 0%, #000 100%);
    }
    
    .cover h1 {
      font-size: 56px;
      font-weight: 700;
      margin-bottom: 12px;
      letter-spacing: -0.03em;
      color: ${getContrastColor(brand.colors.primary)};
    }
    
    .cover .subtitle {
      font-size: 18px;
      font-weight: 300;
      color: ${getContrastColor(brand.colors.primary)};
      opacity: 0.8;
      margin-bottom: 60px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }
    
    .cover .meta {
      position: absolute;
      bottom: 0.6in;
      font-size: 11px;
      color: #666;
    }
    
    /* Table of Contents */
    .toc {
      padding-top: 1in;
    }
    
    .toc h2 {
      font-size: 32px;
      font-weight: 300;
      margin-bottom: 48px;
      letter-spacing: -0.02em;
    }
    
    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 16px 0;
      border-bottom: 1px solid #222;
    }
    
    .toc-item span:first-child {
      font-size: 16px;
    }
    
    .toc-item span:last-child {
      font-size: 14px;
      color: #666;
    }
    
    /* Section Headers */
    h2 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #333;
      letter-spacing: -0.01em;
    }
    
    h3 {
      font-size: 12px;
      font-weight: 600;
      margin: 32px 0 16px 0;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    h4 {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    p {
      color: #ccc;
      margin-bottom: 16px;
    }
    
    .section { margin-bottom: 40px; }
    
    /* Color Swatches */
    .color-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .color-swatch {
      text-align: center;
    }
    
    .color-swatch .swatch {
      width: 100%;
      height: 100px;
      border-radius: 12px;
      margin-bottom: 12px;
      border: 1px solid #333;
      position: relative;
      overflow: hidden;
    }
    
    .color-swatch .swatch::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
    
    .color-swatch .label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
    }
    
    .color-swatch .hex {
      font-size: 14px;
      font-family: 'SF Mono', SFMono-Regular, monospace;
    }
    
    .color-usage {
      background: #111;
      border-radius: 8px;
      padding: 20px;
      margin-top: 24px;
    }
    
    .color-usage h4 {
      font-size: 14px;
      margin-bottom: 12px;
    }
    
    .color-usage ul {
      list-style: none;
      font-size: 13px;
      color: #aaa;
    }
    
    .color-usage li {
      padding: 4px 0;
      padding-left: 16px;
      position: relative;
    }
    
    .color-usage li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: #555;
    }
    
    /* Tone Bars */
    .tone-grid {
      display: grid;
      gap: 20px;
    }
    
    .tone-item {
      background: #111;
      border-radius: 8px;
      padding: 20px;
    }
    
    .tone-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .tone-header .label {
      font-size: 14px;
      font-weight: 500;
    }
    
    .tone-header .value {
      font-size: 24px;
      font-weight: 300;
      color: var(--brand-accent);
    }
    
    .tone-bar {
      height: 6px;
      background: #222;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .tone-bar .fill {
      height: 100%;
      background: linear-gradient(90deg, var(--brand-accent), var(--brand-primary));
      border-radius: 3px;
      transition: width 0.3s;
    }
    
    .tone-description {
      font-size: 12px;
      color: #888;
    }
    
    /* Keywords */
    .keyword-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .keyword {
      padding: 10px 20px;
      background: #111;
      border: 1px solid #333;
      border-radius: 24px;
      font-size: 14px;
    }
    
    /* Rules List */
    .rule-list {
      list-style: none;
    }
    
    .rule-list li {
      padding: 16px 20px;
      background: #111;
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .rule-list .icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 12px;
    }
    
    .rule-list .do .icon { background: #22c55e20; color: #22c55e; }
    .rule-list .dont .icon { background: #ef444420; color: #ef4444; }
    
    /* Voice Samples */
    .voice-sample {
      padding: 24px;
      background: #111;
      border-radius: 12px;
      margin-bottom: 16px;
      position: relative;
      border-left: 4px solid var(--brand-accent);
    }
    
    .voice-sample::before {
      content: '"';
      position: absolute;
      top: 8px;
      left: 16px;
      font-size: 48px;
      color: #333;
      font-family: Georgia, serif;
    }
    
    .voice-sample p {
      font-size: 16px;
      font-style: italic;
      line-height: 1.7;
      color: #ddd;
      padding-left: 24px;
      margin: 0;
    }
    
    /* Visual Concepts */
    .concept-card {
      background: #111;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    
    .concept-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-bottom: 1px solid #222;
    }
    
    .concept-content {
      padding: 24px;
    }
    
    .concept-content h4 {
      font-size: 20px;
      margin-bottom: 12px;
    }
    
    .concept-content p {
      font-size: 14px;
      color: #aaa;
      margin-bottom: 20px;
    }
    
    .concept-colors {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .concept-colors .dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #333;
    }
    
    .concept-moods {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .concept-moods span {
      padding: 6px 14px;
      background: #222;
      border-radius: 16px;
      font-size: 12px;
      color: #aaa;
    }
    
    .concept-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #222;
    }
    
    .concept-details div {
      font-size: 12px;
    }
    
    .concept-details .detail-label {
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    
    .concept-details .detail-value {
      color: #ccc;
    }
    
    /* Approved Content */
    .content-item {
      padding: 20px;
      background: #111;
      border-radius: 12px;
      margin-bottom: 12px;
    }
    
    .content-item .meta {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .content-item .tag {
      font-size: 10px;
      padding: 4px 10px;
      background: #222;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #888;
    }
    
    .content-item .text {
      font-size: 14px;
      line-height: 1.6;
    }
    
    /* Footer */
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #333;
      text-align: center;
      font-size: 11px;
      color: #555;
    }
    
    /* Print Styles */
    @media print {
      body { 
        background: #fff; 
        color: #000; 
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page { 
        background: #fff; 
        box-shadow: none;
      }
      .cover { 
        background: linear-gradient(180deg, var(--brand-primary) 0%, #fff 100%); 
      }
      .color-swatch .swatch { border: 1px solid #ddd; }
      .tone-bar { background: #eee; }
      .keyword, .rule-list li, .voice-sample, .concept-card, .content-item, .tone-item, .color-usage { 
        background: #f5f5f7; 
      }
      .concept-moods span { background: #e5e5e7; }
    }
  </style>
</head>
<body>

<!-- Cover Page -->
<div class="page cover">
  <h1>${brand.name}</h1>
  <p class="subtitle">Brand Guidelines</p>
  <p class="meta">Generated ${today} • Powered by Brandos</p>
</div>

<!-- Table of Contents -->
<div class="page toc">
  <h2>Contents</h2>
  <div class="toc-item"><span>Brand Identity</span><span>02</span></div>
  <div class="toc-item"><span>Color System</span><span>02</span></div>
  <div class="toc-item"><span>Tone Profile</span><span>02</span></div>
  <div class="toc-item"><span>Voice Guidelines</span><span>03</span></div>
  <div class="toc-item"><span>Do's & Don'ts</span><span>03</span></div>
  ${concepts.length > 0 ? '<div class="toc-item"><span>Visual Concepts</span><span>04</span></div>' : ''}
  ${approvedContent.length > 0 ? '<div class="toc-item"><span>Approved Content</span><span>05</span></div>' : ''}
  <span class="page-number">01</span>
</div>

<!-- Brand Identity & Colors -->
<div class="page">
  <h2>Brand Identity</h2>
  
  <div class="section">
    <h3>Color Palette</h3>
    <div class="color-grid">
      <div class="color-swatch">
        <div class="swatch" style="background: ${brand.colors.primary}"></div>
        <div class="label">Primary</div>
        <div class="hex">${brand.colors.primary}</div>
      </div>
      <div class="color-swatch">
        <div class="swatch" style="background: ${brand.colors.secondary}"></div>
        <div class="label">Secondary</div>
        <div class="hex">${brand.colors.secondary}</div>
      </div>
      <div class="color-swatch">
        <div class="swatch" style="background: ${brand.colors.accent}"></div>
        <div class="label">Accent</div>
        <div class="hex">${brand.colors.accent}</div>
      </div>
    </div>
    
    <div class="color-usage">
      <h4>Color Usage Guidelines</h4>
      <ul>
        <li>Primary: Use for main backgrounds, headers, and primary CTAs</li>
        <li>Secondary: Use for text, icons, and supporting elements</li>
        <li>Accent: Use sparingly for highlights, links, and emphasis</li>
      </ul>
    </div>
  </div>
  
  <div class="section">
    <h3>Tone Profile</h3>
    <div class="tone-grid">
      ${Object.entries(brand.tone).map(([key, value]) => `
        <div class="tone-item">
          <div class="tone-header">
            <span class="label">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
            <span class="value">${value}</span>
          </div>
          <div class="tone-bar"><div class="fill" style="width: ${value}%"></div></div>
          <div class="tone-description">${toneDescriptions[key as keyof typeof toneDescriptions]}</div>
        </div>
      `).join('')}
    </div>
  </div>
  
  ${brand.keywords.length > 0 ? `
  <div class="section">
    <h3>Brand Keywords</h3>
    <div class="keyword-grid">
      ${brand.keywords.map((kw) => `<span class="keyword">${kw}</span>`).join('')}
    </div>
  </div>
  ` : ''}
  
  <span class="page-number">02</span>
</div>

<!-- Voice & Guidelines -->
<div class="page">
  <h2>Voice Guidelines</h2>
  
  ${brand.voiceSamples.length > 0 ? `
  <div class="section">
    <h3>Voice Samples</h3>
    <p style="font-size: 13px; color: #888; margin-bottom: 20px;">These examples capture the ideal tone and personality of ${brand.name}.</p>
    ${brand.voiceSamples.map((sample) => `
      <div class="voice-sample">
        <p>${sample}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
    ${brand.doPatterns.length > 0 ? `
    <div class="section">
      <h3>Do's ✓</h3>
      <ul class="rule-list">
        ${brand.doPatterns.map((rule) => `
          <li class="do">
            <span class="icon">✓</span>
            <span>${rule}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${brand.dontPatterns.length > 0 ? `
    <div class="section">
      <h3>Don'ts ✗</h3>
      <ul class="rule-list">
        ${brand.dontPatterns.map((rule) => `
          <li class="dont">
            <span class="icon">✗</span>
            <span>${rule}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
  
  <span class="page-number">03</span>
</div>

${concepts.length > 0 ? `
<!-- Visual Concepts -->
<div class="page">
  <h2>Visual Concepts</h2>
  <p style="font-size: 13px; color: #888; margin-bottom: 32px;">
    These visual directions were generated from inspiration imagery to guide design decisions.
  </p>
  
  ${concepts.map((concept) => `
    <div class="concept-card">
      ${concept.imageUrl ? `<img src="${concept.imageUrl}" class="concept-image" alt="${concept.title}" crossorigin="anonymous" />` : ''}
      <div class="concept-content">
        <h4>${concept.title}</h4>
        <p>${concept.description}</p>
        
        ${concept.colorPalette?.length > 0 ? `
        <div class="concept-colors">
          ${concept.colorPalette.map((c) => `<div class="dot" style="background: ${c}"></div>`).join('')}
        </div>
        ` : ''}
        
        ${concept.moodKeywords?.length > 0 ? `
        <div class="concept-moods">
          ${concept.moodKeywords.map((m) => `<span>${m}</span>`).join('')}
        </div>
        ` : ''}
        
        <div class="concept-details">
          ${concept.typography ? `
          <div>
            <div class="detail-label">Typography</div>
            <div class="detail-value">${concept.typography}</div>
          </div>
          ` : ''}
          ${concept.imagery ? `
          <div>
            <div class="detail-label">Imagery</div>
            <div class="detail-value">${concept.imagery}</div>
          </div>
          ` : ''}
        </div>
        
        ${concept.doNotUse?.length > 0 ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #222;">
          <div class="detail-label" style="color: #ef4444; margin-bottom: 8px;">Avoid</div>
          <div class="detail-value">${concept.doNotUse.join(' • ')}</div>
        </div>
        ` : ''}
      </div>
    </div>
  `).join('')}
  
  <span class="page-number">04</span>
</div>
` : ''}

${approvedContent.length > 0 ? `
<!-- Approved Content -->
<div class="page">
  <h2>Approved Content</h2>
  <p style="font-size: 13px; color: #888; margin-bottom: 32px;">
    These content pieces have been approved as on-brand examples.
  </p>
  
  ${approvedContent.map((item) => `
    <div class="content-item">
      <div class="meta">
        <span class="tag">${item.type}</span>
        ${item.platform ? `<span class="tag">${item.platform}</span>` : ''}
      </div>
      <div class="text">${item.content}</div>
    </div>
  `).join('')}
  
  <span class="page-number">05</span>
</div>
` : ''}

<!-- Back Cover -->
<div class="page cover" style="background: #000;">
  <div style="text-align: center;">
    <h2 style="font-size: 24px; font-weight: 300; margin-bottom: 16px; border: none; padding: 0;">
      ${brand.name}
    </h2>
    <p style="color: #666; font-size: 14px;">Brand Guidelines ${new Date().getFullYear()}</p>
  </div>
  <div class="footer">
    Generated by Brandos • The AI Brand Guardian
  </div>
</div>

</body>
</html>
  `.trim();
}

// Helper function to get contrasting text color
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
