(() => {
  if (customElements.get('shop-module-carousel')) {
    return;
  }

  class ShopModule extends customElements.get('slider-component') {
    constructor() {
      super();
      this.options = {
        ...this.options,
        slidesPerView: 'auto',
        spaceBetween: 16,
        breakpoints: {
          990: {
            speed: 1000
          }
        }
      };

      // Custom events
      this.options.on.slideChange = swiper => {
        const changeEvent = new Event('slideChange');
        changeEvent.activeSlide = this.querySelector(
          `.swiper-slide[data-id="${swiper.activeIndex}"]`
        );
        this.dispatchEvent(changeEvent);
        this.setPaginationState(swiper);
      };
    }

    goToSlide(slideId) {
      this.slider.slideTo(Number(slideId));
    }
  }

  customElements.define('shop-module-carousel', ShopModule);
})();
