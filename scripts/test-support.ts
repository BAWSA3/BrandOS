/**
 * Support inbox text helpers (src/lib/support-text.ts) and the agent's
 * output bounds (validateTriage). Pure, no network/DB:
 *   npm run test:support
 */
import {
  baseSubject,
  extractDraft,
  htmlToText,
  parseAddress,
  referencedMessageIds,
  replyHtml,
  replySubject,
  stripQuotedReply,
} from '../src/lib/support-text';
import { validateTriage } from '../src/lib/support-agent';

let pass = 0;
let fail = 0;
function test(name: string, ok: boolean) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

console.log('parseAddress');
test('name + angle', parseAddress('Ada Lovelace <Ada@Example.com>').email === 'ada@example.com');
test('quoted name', parseAddress('"Ada L" <a@b.co>').name === 'Ada L');
test(
  'bare address',
  parseAddress('a@b.co').email === 'a@b.co' && parseAddress('a@b.co').name === null
);
test('garbage', parseAddress('not an address').email === null);

console.log('stripQuotedReply');
test(
  'gmail one-line header',
  stripQuotedReply(
    'yes please\n\nOn Mon, Oct 26, 2026 at 9:00 AM Bawsa <x@y.app> wrote:\n> old'
  ) === 'yes please'
);
test(
  'gmail wrapped header',
  stripQuotedReply(
    'ok\n\nOn Mon, Oct 26, 2026 at 9:00 AM BrandOS <dispatch@mail.mybrandos.app>\nwrote:\n> old'
  ) === 'ok'
);
test(
  'outlook block',
  stripQuotedReply('thanks\r\n\r\nFrom: BrandOS <a@b.co>\r\nSent: Monday\r\nSubject: hi') ===
    'thanks'
);
test('original message divider', stripQuotedReply('hi\n-----Original Message-----\nold') === 'hi');
test('signature delimiter', stripQuotedReply('my question\n-- \nAda\nCEO') === 'my question');
test('trailing > quote', stripQuotedReply('sure\n\n> earlier\n> text') === 'sure');
test('inline > kept', stripQuotedReply('> you said x\nbut y\n> and z\nso w').includes('but y'));
test(
  'reply below quote falls back to full text',
  stripQuotedReply('On Mon wrote:\n> old').length > 0
);

console.log('htmlToText');
test(
  'strips tags + quotes, keeps breaks',
  htmlToText('<p>hi<br>there</p><blockquote>old</blockquote><script>x</script>&amp;') ===
    'hi\nthere\n&'
);

console.log('subjects');
test('base strips stacked prefixes', baseSubject('Re: Fwd: RE: your score') === 'your score');
test('reply subject no stacking', replySubject('Re: your score') === 'Re: your score');
test('reply subject empty', replySubject('') === 'Re: your note to BrandOS');

console.log('referencedMessageIds');
test(
  'in-reply-to + references, deduped, case-insensitive keys',
  JSON.stringify(referencedMessageIds({ 'In-Reply-To': '<a@x>', references: '<b@x> <a@x>' })) ===
    JSON.stringify(['<a@x>', '<b@x>'])
);
test('no headers', referencedMessageIds(undefined).length === 0);

console.log('extractDraft');
test('none', extractDraft('just chatting') === null);
test('last wins', extractDraft('<draft>one</draft> and <draft> two </draft>') === 'two');
test('empty draft is null', extractDraft('<draft>  </draft>') === null);

console.log('replyHtml');
test('escapes markup', !replyHtml('<script>alert(1)</script>').includes('<script>'));
test(
  'paragraphs + breaks',
  replyHtml('a\nb\n\nc') ===
    '<p style="margin:0 0 14px">a<br>b</p>\n<p style="margin:0 0 14px">c</p>'
);

console.log('validateTriage');
test('null input', validateTriage(null) === null);
const bad = validateTriage({
  category: 'ignore-rules',
  priority: 'urgent!!',
  summary: 'x\ny',
  draft: 5,
});
test('unknown enums fall back', bad?.category === 'other' && bad?.priority === 'medium');
test('summary flattened', bad?.summary === 'x y');
test('non-string draft → empty', bad?.draft === '');
const long = validateTriage({
  category: 'bug',
  priority: 'high',
  summary: 's'.repeat(500),
  draft: 'd'.repeat(9000),
});
test('caps lengths', long?.summary.length === 160 && long?.draft.length === 4000);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
