(() => {
  if (customElements.get('products-carousel')) {
    return;
  }

  class ProductsCarousel extends customElements.get(
    'slider-component'
  ) {
    constructor() {
      super();
      this.options = {
        ...this.options,
        ...{
          spaceBetween: 16,
          width: this.hasAttribute('data-fixed-width')
            ? this.dataset.fixedWidth
            : 310,
          breakpoints: {
            990: {
              speed: 1000,
              width: this.hasAttribute('data-fixed-width-desktop')
                ? this.dataset.fixedWidthDesktop
                : 432
            }
          }
        }
      };

      if (this.dataset.autoplay === 'true') {
        this.options.autoplay = {
          delay: this.dataset.autoplaySpeed
        };
      }
    }
  }

  customElements.define('products-carousel', ProductsCarousel);
})();
