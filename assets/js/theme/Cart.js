import PageManager from '../PageManager';
import utils from '@bigcommerce/stencil-utils';
import CartUtils from './cart/CartUtils';
import ShippingCalculator from './cart/ShippingCalculator';
import CouponCodes from './cart/CouponCodes';
import GiftCertificates from './cart/GiftCertificates';
import GiftWrapping from './cart/GiftWrapping';
import Loading from 'bc-loading';
import QuantityWidget from './components/QuantityWidget';
import svgIcon from './global/svgIcon';

export default class Cart extends PageManager {
  constructor() {
    super();

    this.$cartContent = $('[data-cart-content]');

    this._bindEvents();

    // brute-force apple-pay bodyclass in local environment
    if (window.ApplePaySession && $('.dev-environment').length) {
      $(document.body).addClass('apple-pay-supported');
    }
  }

  loaded(next) {
    const context = this.context;

    new QuantityWidget({scope: '[data-cart-content]'});

    const loadingOptions = {
      loadingMarkup: `<div class="loading-overlay">${svgIcon('spinner')}</div>`,
    };

    new GiftWrapping({scope: '[data-cart-content]', context});
    const cartContentOverlay = new Loading(loadingOptions, true, '.product-listing');
    const cartTotalsOverlay = new Loading(loadingOptions, true, '[data-cart-totals]');

    this.ShippingCalculator = new ShippingCalculator('[data-shipping-calculator]', {
      context,
      visibleClass: 'visible',
      callbacks: {
        willUpdate: () => cartTotalsOverlay.show(),
        didUpdate: () => cartTotalsOverlay.hide(),
      },
    });

    this.CouponCodes = new CouponCodes('[data-coupon-codes]', {
      context,
      visibleClass: 'visible',
      callbacks: {
        willUpdate: () => cartTotalsOverlay.show(),
        didUpdate: () => cartTotalsOverlay.hide(),
      },
    });

    this.GiftCertificates = new GiftCertificates('[data-gift-certificates]', {
      context,
      visibleClass: 'visible',
      callbacks: {
        willUpdate: () => cartTotalsOverlay.show(),
        didUpdate: () => cartTotalsOverlay.hide(),
      },
    });

    this.CartUtils = new CartUtils({
      ShippingCalculator: this.ShippingCalculator,
      CouponCodes: this.CouponCodes,
      GiftCertificates: this.GiftCertificates,
    }, {
      callbacks: {
        willUpdate: () => cartContentOverlay.show(),
        didUpdate: () => cartContentOverlay.hide(),
      },
    }).init();

    next();
  }

  _bindEvents() {
    this.$cartContent.on('change', '[data-quantity-control-input]', (event) => {
      $(event.currentTarget).closest('.cart-item').addClass('needs-updating');
    });
  }
}
