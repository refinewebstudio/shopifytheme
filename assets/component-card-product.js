if (!customElements.get('card-product')) {
  class CardProduct extends HTMLElement {
    constructor() {
      super();

      this.quickviewModalsHTML = {};
      this.variants = JSON.parse(
        this.querySelector('[type="application/json"][data-variants]')
          .textContent
      );
      this.variantsImages = JSON.parse(
        this.querySelector(
          '[type="application/json"][data-variants-images]'
        ).textContent
      );
      this.swatches = this.querySelectorAll('[data-swatch]');

      this.swatches.forEach(swatch => {
        swatch.addEventListener(
          'change',
          this.onSwatchChange.bind(this)
        );
      });
      this.activeVariant = this.variants?.find(
        variant => variant.id === Number(this.dataset.activeVariantId)
      );
    }

    onSwatchChange(event) {
      const activeVariant = this.variants.find(
        variant =>
          variant[`option${this.dataset.swatchOptionIndex}`] ===
          event.target.value
      );
      this.activeVariant = activeVariant;
      this.updateAssets(activeVariant);
    }

    updateAssets(activeVariant) {
      this.updateMedia(activeVariant);
      this.updateLinks(activeVariant);
    }

    updateMedia(activeVariant) {
      const media = this.querySelector('[data-media]');
      const primaryImage = this.querySelector('[data-image-primary]');
      const variantImage = this.variantsImages.find(
        variant => variant.id === activeVariant.id
      );

      if (!primaryImage || !variantImage) return;

      media.classList.add('is-loading');
      primaryImage.addEventListener(
        'transitionend',
        () => {
          primaryImage.src = variantImage.image.src;
          primaryImage.srcset = variantImage.image.srcset;
          primaryImage.onload = () => {
            media.classList.add('is-changed');
            media.classList.remove('is-loading');
          };
        },
        { once: true }
      );
    }

    updateLinks(activeVariant) {
      const links = this.querySelectorAll('[data-url]');

      links.forEach(link => {
        link.setAttribute(
          link.hasAttribute('href') ? 'href' : 'data-url',
          `${this.dataset.productUrl}?variant=${activeVariant.id}`
        );
      });
    }
  }

  customElements.define('card-product', CardProduct);
}

if (!customElements.get('quickview-opener')) {
  class QuickviewOpener extends ModalOpener {
    constructor() {
      super();
    }

    onButtonClick(button) {
      const productCard = this.closest('card-product');
      const existingModal =
        productCard.quickviewModalsHTML[productCard.activeVariant.id];

      button.classList.add('is-loading');

      if (existingModal) {
        document.body.appendChild(existingModal);
        setTimeout(() => {
          super.onButtonClick(button);
          button.classList.remove('is-loading');
        }, 300);
        return;
      }

      fetch(`${button.getAttribute('data-url')}&section_id=quickview`)
        .then(response => response.text())
        .then(text => {
          const modal = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('template')
            .content.firstElementChild.cloneNode(true);
          productCard.quickviewModalsHTML[
            productCard.activeVariant.id
          ] = modal;

          // Avoid mozilla not initializing scripts
          modal.querySelectorAll('script').forEach(sciprtTag => {
            const scriptElement = document.createElement('script');
            scriptElement.src = sciprtTag.src;
            document.body.appendChild(scriptElement);
          });

          document.body.appendChild(modal);
          setTimeout(() => {
            super.onButtonClick(button);
            button.classList.remove('is-loading');
            Shopify?.PaymentButton?.init();
          }, 300);
        })
        .catch(error => console.log(error));
    }
  }

  customElements.define('quickview-opener', QuickviewOpener);
}
