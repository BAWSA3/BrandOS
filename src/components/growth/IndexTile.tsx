'use client';

import Link from 'next/link';
import { formatNumber } from '@/lib/index-rules';
import { BIG, Label, MONO, T, Tile } from './parts';

/**
 * The Creator Index on the growth dashboard: "Join the Index" for
 * non-members; for members, their number and who viewed their page this
 * week. The count is free; which brand/agency teams looked is the Pro
 * (founding card) perk, shown locked otherwise.
 */
export interface IndexTileData {
  member: { number: number; listed: boolean; handle: string } | null;
  views: { people: number; teams: { name: string; views: number }[] | null } | null;
  standsOut: boolean;
}

export default function IndexTile({ data }: { data: IndexTileData }) {
  const { member, views, standsOut } = data;
  if (!member) {
    return (
      <Tile className="md:col-span-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Label color={T.blue}>The BrandOS Creator Index</Label>
            <div
              className="mt-3 text-[28px] leading-tight md:text-[36px]"
              style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.03em' }}
            >
              Get found by brands. Get your number.
            </div>
            <p className="mt-2 max-w-[560px] text-[14px]" style={{ color: T.muted }}>
              A public book of creators with a real brand read behind them. Brands browse it free.
              Early members get the low numbers.
            </p>
          </div>
          <Link
            href="/index/join"
            className="px-6 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white"
            style={{ fontFamily: MONO, background: T.blue }}
          >
            Join the Index →
          </Link>
        </div>
      </Tile>
    );
  }
  const people = views?.people ?? 0;
  return (
    <Tile className="md:col-span-12">
      <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-end">
        <div>
          <Label color={T.blue}>
            {member.listed ? 'In the Creator Index' : 'Hidden from the Index'}
          </Label>
          <div
            className="mt-2 text-[44px] leading-none md:text-[56px]"
            style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em', color: T.blue }}
          >
            {formatNumber(member.number)}
          </div>
        </div>
        <div>
          <Label>Viewed you · last 7 days</Label>
          <div className="mt-2 text-[15px]">
            {people === 0
              ? 'No signed-in visitors yet. Share your number to get seen.'
              : `${people} ${people === 1 ? 'person' : 'people'} opened your page.`}
          </div>
          {standsOut ? (
            views?.teams && views.teams.length > 0 ? (
              <ul className="mt-2 space-y-1 text-[14px]">
                {views.teams.map((t) => (
                  <li key={t.name}>
                    <span style={{ color: T.blue }}>{t.name}</span>
                    <span style={{ color: T.muted }}>
                      {' '}
                      · {t.views} {t.views === 1 ? 'view' : 'views'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[13px]" style={{ color: T.muted }}>
                Brand and agency teams that view you show up here.
              </p>
            )
          ) : (
            <p className="mt-1 text-[13px]" style={{ color: T.muted }}>
              {people > 0
                ? 'See which brands and agencies they were with'
                : 'See which brands view you'}{' '}
              <Link href="/pricing" style={{ color: T.blue }}>
                with Pro →
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <Link
            href={`/index?m=${member.handle}`}
            className="border px-4 py-2.5 text-[11px] uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO, borderColor: T.ink }}
          >
            Your card in the Index
          </Link>
          <Link
            href="/index/join"
            className="text-[11px] uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO, color: T.muted }}
          >
            Edit or leave
          </Link>
        </div>
      </div>
    </Tile>
  );
}
