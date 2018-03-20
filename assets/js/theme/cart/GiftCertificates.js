import utils from '@bigcommerce/stencil-utils';
import Alert from '../components/Alert';
import refreshContent from './refreshContent';

export default class GiftCertificates {
  constructor(el, options) {
    this.$el = $(el);
    this.certificateAlerts = new Alert($('[data-alerts]'));

    this.options = $.extend({
      context: {},
      $scope: $('[data-cart-totals]'),
      visibleClass: 'visible',
    }, options);

    this.callbacks = $.extend({
      willUpdate: () => console.log('Update requested.'),
      didUpdate: () => console.log('Update executed.'),
    }, options.callbacks);

    this._bindEvents();
  }

  _bindEvents() {
    this.options.$scope.on('click', '[data-gift-certificate-toggle]', (event) => {
      event.preventDefault();
      this._toggle();
    });

    this.options.$scope.on('submit', '[data-gift-certificate-form]', (event) => {
      event.preventDefault();
      this._addCode();
    });
  }

  _toggle() {
    $('[data-gift-certificate-form]', this.options.$scope).toggleClass(this.options.visibleClass);
  }

  _addCode() {
    const $input = $('[data-gift-certificate-input]', this.options.$scope);
    const code = $input.val();

    this.callbacks.willUpdate();

    if (! this._isValidCode(code)) {
      this.certificateAlerts.error(this.options.context.giftCertificateInputEmpty, true);
      return this.callbacks.didUpdate();
    }

    utils.api.cart.applyGiftCertificate(code, (err, response) => {
      if (response.data.status === 'success') {
        refreshContent(this.callbacks.didUpdate);
      } else {
        this.certificateAlerts.error(response.data.errors.join('\n'), true);
        this.callbacks.didUpdate();
      }
    });
  }

  _isValidCode(code) {
    if (typeof code !== 'string') {
      return false;
    }

    return true;
  }
}
