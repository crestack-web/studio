import React from 'react';
import { BUSMO_ONE_CONFIG, formatNgn, getBusmoOneChargePrice } from '@/lib/busmo-one/config';
import { BLACK_FRIDAY, isBlackFridayActive } from '@/lib/pricing';

export function AnnouncementBar() {
  const bf = isBlackFridayActive();
  const one = getBusmoOneChargePrice();

  return (
    <div className="announcement-bar" role="region" aria-label="Promotions">
      <div className="announcement-inner">
        <span className="announcement-text">
          {bf ? (
            <>
              <strong>{BLACK_FRIDAY.headline}</strong>
              {' · '}
              {BUSMO_ONE_CONFIG.productName} from {formatNgn(one.charge)}
              {one.saleActive ? (
                <>
                  {' '}
                  <s style={{ opacity: 0.75 }}>{formatNgn(one.list)}</s>
                </>
              ) : null}
              {' + '}
              {BUSMO_ONE_CONFIG.promotionLabel}
            </>
          ) : (
            <>
              <strong>{BUSMO_ONE_CONFIG.productName}</strong>
              {' — '}
              {formatNgn(BUSMO_ONE_CONFIG.launchPriceNgn)} + {BUSMO_ONE_CONFIG.promotionLabel}
            </>
          )}
        </span>
        <a href="/welcome#busmo-one" className="announcement-cta">
          {bf ? 'Buy now' : 'Get Busmo One'}
        </a>
      </div>
    </div>
  );
}
