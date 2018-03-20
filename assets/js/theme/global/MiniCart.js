import utils from '@bigcommerce/stencil-utils';
import svgIcon from './svgIcon';

export default class MiniCart {
  constructor() {
    this.cartChangeRemoteHooks = [
      'cart-item-add-remote',
      'cart-item-update-remote',
      'cart-item-remove-remote',
    ];

    this._bindEvents();
  }

  _bindEvents() {
    // Update minicart on successful add to cart
    $(document).on('cart-item-add-success', () => {
      this._update();
    });

    // Remove cart item using minicart button
    $('body').on('click', '.mini-cart [data-cart-item-remove]', (event) => {
      event.preventDefault();

      this._removeProductMiniCart(event);
    });

    // remote events: when the proper response is sent
    this.cartChangeRemoteHooks.forEach((hook) => {
      utils.hooks.on(hook, () => {
        this._update();
      });
    });

    // Custom scroll UX for minicart
    this._bindScroll();
  }

  /**
   * Update the mini cart contents
   */
  _update(callback) {
    const $miniCart = $('.mini-cart-inner');

    const $miniCartTotal = $('.site-header .mini-cart-subtotal');
    const $miniCartContents = $('.mini-cart-contents');

    // Update the minicart items when
    // a product is added / removed
    utils.api.cart.getContent({ template: 'mini-cart/mini-cart-contents' }, (err, response) => {
      $miniCartContents.html(response);

      // Update the header subtotal
      const subtotal = $(response).find('[data-cart-subtotal]').text();
      const subtotalRaw = $(response).find('.mini-cart-subtotal').attr('data-cart-subtotal');
      $miniCartTotal.html(subtotal).attr('data-cart-subtotal', subtotalRaw);

      $miniCart.animate({
        top: 0
      });

      if (callback) {
        callback();
      }
    });
  }

  /**
   * Remove a product from the mini cart
   */
  _removeProductMiniCart(event) {
    const $el = $(event.currentTarget);
    const itemId = $el.data('product-id');

    if (! itemId) { return; }

    $el
      .closest('.mini-cart-item')
      .addClass('removing')
      .append(`${svgIcon('spinner')}`);

    utils.api.cart.itemRemove(itemId, (err, response) => {
      if (response.data.status === 'succeed') {
        this._update();
      } else {
        alert(response.data.errors.join('\n'));
        $el
          .closest('.mini-cart-item')
          .removeClass('removing')
          .find('.icon-spinner')
          .remove();
      }
    });
  }

  /**
   * Custom scroll behavior for mini cart panel
   */
  _bindScroll() {
    const $win = $(window);
    const $miniCart = $('.mini-cart-inner');
    let oldScrollTop = $(window).scrollTop();

    $win.on('scroll', () => {
      const winHeight = $win.height();
      const miniCartHeight = $miniCart.height();
      const maxScroll = miniCartHeight - winHeight;
      const newScrollTop = $win.scrollTop();

      let cartTopPos = parseInt($miniCart.css('top'));
      let scrollAmount;

      // If the menu is taller than the window and visible
      if ( (miniCartHeight > winHeight) && $('body').hasClass('mini-cart-open') ) {

        // Set the amount we've scrolled
        scrollAmount = oldScrollTop - newScrollTop;

        // Move the minicart up/down the amount we scrolled
        $miniCart.css({
          top: '+=' + scrollAmount,
        });

        // Get the minicart's top value after it's updated
        cartTopPos = parseInt($miniCart.css('top'));

        // Don't scroll beyond the bottom or top limits of the menu
        // The second conditon checks for 'overscroll' that occurs in webkit
        if ( (cartTopPos < -maxScroll) || ((newScrollTop + winHeight) >= $('.site-wrapper').outerHeight()) ) {
          // stop at bottom of minicart
          $miniCart.css({
            top: -maxScroll + 'px'
          });
        } else if ( cartTopPos > 0 || newScrollTop <= 0 ) {
          // stop at top of minicart
          $miniCart.css({
            top: 0
          });
        }
      }

      // Update oldScrollTop as we scroll
      oldScrollTop = newScrollTop;
    });
  }
}
