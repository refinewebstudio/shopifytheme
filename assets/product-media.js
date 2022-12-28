/**
 * Uses Swiper package to create a carousel for product media
 * More info: https://swiperjs.com//
 */
if (!customElements.get('product-media')) {
  class ProductMedia extends HTMLElement {
    constructor() {
      super();

      this.swiperInitialized = false;
      this.productModalHTML = {};
      this.selectors = {
        header: 'sticky-header',
        slider: '[data-slider]',
        thumbs: '[data-thumbs]',
        mediaItem: '[data-media-item]',
        mediaColor: 'data-media-color',
        thumbnail: '[data-thumbnail]'
      };
      this.filterMediaBy = this.dataset.galleryFilter;
      this.selectedMediaIndex =
        Number(
          this.querySelector(this.selectors.slider)?.querySelector(
            '[data-selected]'
          )?.dataset.index
        ) || 0;
      this.breakpoints = {
        desktop: 990,
        desktop_large: 1440
      };
      this.settings = {
        elements: {
          slider: this.querySelector(this.selectors.slider),
          thumbs: this.querySelector(this.selectors.thumbs)
        },
        instances: {
          slider: null,
          thumbs: null
        },
        options: {
          slider: {
            initialSlide: this.selectedMediaIndex,
            watchOverflow: true,
            watchSlidesVisibility: true,
            watchSlidesProgress: true,
            pagination: {
              el: '.swiper-pagination',
              type: 'progressbar'
            },
            autoHeight: this.hasAttribute('data-slider-autoheight'),
            breakpoints: {
              [this.breakpoints.desktop]: {
                allowTouchMove: false,
                pagination: false
              }
            }
          },
          thumbs: {
            initialSlide: this.selectedMediaIndex,
            spaceBetween: 16,
            slidesPerView: this.hasAttribute('data-thumbs-layout')
              ? 3.49
              : 4.17,
            watchOverflow: true,
            watchSlidesProgress: true,
            setWrapperSize: true,
            navigation: {
              nextEl: '[data-thumbs-next]',
              prevEl: '[data-thumbs-prev]'
            },
            direction: this.hasAttribute('data-thumbs-layout')
              ? 'vertical'
              : 'horizontal',
            breakpoints: {
              [this.breakpoints.desktop_large]: {
                slidesPerView: this.hasAttribute('data-thumbs-layout')
                  ? 3.3
                  : 4.26
              }
            }
          }
        }
      };
    }

    connectedCallback() {
      this.init();
      window.addEventListener(
        'resize',
        debounce(() => {
          this.initSwiper();
        }, 300)
      );
    }

    init() {
      const photoSwipeLightboxInstance = new PhotoSwipeLightbox({
        gallery: this,
        children: 'a[data-pswp-image]',
        pswpModule: PhotoSwipe
      });

      photoSwipeLightboxInstance.init();
      this.initSwiper();
    }

    initSwiper() {
      if (
        window.innerWidth <= this.breakpoints.desktop ||
        !this.hasAttribute('data-slider-desktop-disabled')
      ) {
        if (this.swiperInitialized || !this.settings.elements.slider)
          return;

        this.swiperInitialized = true;

        if (this.settings.elements.thumbs) {
          this.settings.instances.thumbs = new Swiper(
            this.settings.elements.thumbs,
            this.settings.options.thumbs
          );
          this.settings.options.slider.thumbs = {
            swiper: this.settings.instances.thumbs
          };
        }

        this.settings.instances.slider = new Swiper(
          this.settings.elements.slider,
          this.settings.options.slider
        );

        if (this.settings.elements.thumbs) {
          this.settings.instances.slider.on(
            'slideChangeTransitionStart',
            () => {
              this.settings.instances.thumbs.slideTo(
                this.settings.instances.slider.activeIndex
              );
            }
          );

          this.settings.instances.thumbs.on('transitionStart', () => {
            this.settings.instances.slider.slideTo(
              this.settings.instances.thumbs.activeIndex
            );
          });
        }

        this.settings.instances.slider.on('slideChange', () => {
          window.pauseAllMedia();
        });
      } else if (
        this.swiperInitialized &&
        this.hasAttribute('data-slider-desktop-disabled')
      ) {
        this.settings.instances.slider.destroy();
        if (this.settings.instances.thumbs) {
          this.settings.instances.thumbs.destroy();
        }
        this.swiperInitialized = false;
      }
    }

    setActiveMedia(id) {
      const mediaFound = Array.from(
        this.querySelectorAll(this.selectors.mediaItem)
      ).find(media => Number(media.dataset.mediaId) === id);
      if (!mediaFound) return;
      if (
        !this.settings.instances.slider ||
        this.settings.instances.slider?.destroyed
      ) {
        const headerHeight =
          document.querySelector(this.selectors.header)
            ?.offsetHeight || 0;
        window.scroll({
          top:
            mediaFound.getBoundingClientRect().top +
            window.scrollY -
            headerHeight,
          behavior: 'smooth'
        });
        return;
      }
      this.settings.instances.slider.slideTo(
        Number(mediaFound.dataset.index)
      );
    }

    filterMedia({ name, value }) {
      if (name !== this.filterMediaBy) return;

      const filteredMedia = this.querySelectorAll(
        `${this.selectors.mediaItem}[${this.selectors.mediaColor}="${value}"], ${this.selectors.thumbnail}[${this.selectors.mediaColor}="${value}"]`
      );
      const hasFilteredMedia = filteredMedia.length !== 0;

      this.querySelectorAll(
        `${this.selectors.mediaItem}, ${this.selectors.thumbnail}`
      ).forEach(media => {
        if (!hasFilteredMedia) {
          media.classList.add('swiper-slide');
          media.classList.remove('hidden');
        } else {
          media.classList.remove('swiper-slide');
          media.classList.add('hidden');
        }
      });

      const inactiveSliderInstance =
        !this.settings.instances.slider ||
        this.settings.instances.slider?.destroyed;

      if (!hasFilteredMedia && !inactiveSliderInstance) {
        this.settings.instances.slider.update();
        this.settings.instances.thumbs?.update();
        return;
      }

      this.querySelectorAll(
        `${this.selectors.mediaItem}[${this.selectors.mediaColor}="${value}"], ${this.selectors.thumbnail}[${this.selectors.mediaColor}="${value}"]`
      ).forEach(media => {
        media.classList.add('swiper-slide');
        media.classList.remove('hidden');
      });

      if (inactiveSliderInstance) return;

      this.settings.instances.slider.update();
      this.settings.instances.thumbs?.update();
    }
  }

  customElements.define('product-media', ProductMedia);
}
