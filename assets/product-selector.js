if (!customElements.get('product-selector')) {
  class ProductSelector extends HTMLElement {
    constructor() {
      super();
      this.isQuickviewSelector = !!this.closest('product-quickview');
      this.productBar = document.querySelector('product-bar');
      this.form = this.querySelector('form');
      this.quantity = this.form.elements.quantity;
      this.dynamicCheckoutForm = document.querySelector(
        this.dataset.dynamicCheckoutFormId
      );
      this.installmentsForm = document.querySelector(
        this.dataset.installmentsFormId
      );
      this.form.addEventListener(
        'submit',
        this.onSubmitHandler.bind(this)
      );
      this.cartDrawer = document.querySelector('cart-drawer');
      this.variants = JSON.parse(
        this.querySelector('[type="application/json"]').textContent
      );
      this.addEventListener('change', this.onVariantChange);

      if (this.quantity) {
        this.quantity.addEventListener(
          'change',
          this.onQuantityChange.bind(this)
        );
      }
      this.updateOptions();
    }

    connectedCallback() {
      this.submitButton = this.form.elements.add;
      if (this.isQuickviewSelector) return;
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has('variant')) return;
      this.updateOptions();
      this.updateVariant();
      this.updateMedia({});
    }

    onQuantityChange(event) {
      const productBarQuantity = this.productBar?.querySelector(
        '[name="quantity"]'
      );
      if (productBarQuantity) {
        productBarQuantity.value = event.target.value;
      }

      if (!this.dynamicCheckoutForm) return;

      this.dynamicCheckoutForm.querySelector(
        '[name="quantity"]'
      ).value = event.target.value;
    }

    cartSubmitHandler() {
      this.submitButton.classList.add('disabled');

      addToCart(
        this.form,
        'main-cart'
      )
        .then(response => {
          if (response.status) {
            this.handleErrorMessage(response.description);
            return;
          }

          this.handleErrorMessage();

          if (this.isQuickviewSelector) {
            const quickviewModal = this.closest('modal-dialog');
            quickviewModal.hide();
          }

          if(!response?.sections['main-cart']) return;

          const html = new DOMParser().parseFromString(response.sections['main-cart'], 'text/html');
          if(!html) return;

          const newCartItems = html.querySelector('cart-items');
          const cartItems = document.querySelector('cart-items');

          if(!newCartItems || !cartItems) return;
          cartItems.outerHTML = newCartItems.outerHTML;
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          this.submitButton.classList.remove('disabled');
        });
    }

    defaultSubmitHandler() {
      this.submitButton.classList.add('disabled');

      addToCart(
        this.form,
        this.cartDrawer
          .getSectionsToRender()
          .map(section => section.section)
      )
        .then(response => {
          if (response.status) {
            this.handleErrorMessage(response.description);
            return;
          }

          this.handleErrorMessage();

          if (this.isQuickviewSelector) {
            const quickviewModal = this.closest('modal-dialog');
            quickviewModal.hide();
          }
          this.cartDrawer.renderContents(response);
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          this.submitButton.classList.remove('disabled');
        });
    }

    onSubmitHandler(event) {
      event.preventDefault();

      if(window.location.pathname == routes.cart_url) return this.cartSubmitHandler();
      if (this.cartDrawer) return this.defaultSubmitHandler();
    }

    handleErrorMessage(errorMessage = false) {
      const errorWrapper = this.querySelector('[data-error-wrapper]');
      if (!errorWrapper) return;
      errorWrapper.classList.toggle('hidden', !errorMessage);
      errorWrapper.textContent = errorMessage || '';
    }

    onVariantChange(event) {
      if (
        event.target.type === 'number' ||
        event.target.name === 'id'
      )
        return;
      this.updateLabel(event);
      this.updateOptions();
      this.productBarUpdateOptions();
      this.updateVariant();
      this.toggleAddButton(false, '');
      this.handleErrorMessage();

      if (!this.currentVariant) {
        this.toggleAddButton(true, '');
        this.setUnavailable();

        return;
      }

      if (!this.currentVariant.available)
        this.toggleAddButton(true, window.variantStrings.soldOut);

      this.updateMedia({
        name: event.target.dataset.name,
        value: event.target.value
      });
      this.updateURL();
      this.updateVariantInput();
      this.fetchProductInfo();
    }

    updateLabel(event) {
      const valueHolder = event.target
        .closest('fieldset')
        ?.querySelector('[data-option-selected-value]');
      if (!valueHolder) return;
      valueHolder.textContent = event.target.value;
    }

    updateOptions() {
      this.options = Array.from(
        this.querySelectorAll('input[type="radio"]:checked, select'),
        el => ({ name: el.dataset.name, value: el.value })
      );
    }

    productBarUpdateOptions() {
      if (!this.productBar || this.isQuickviewSelector) return;

      Array.from(this.productBar.querySelectorAll('[data-name]')).map(
        selector => {
          selector.value = this.options.find(
            option => option.name === selector.dataset.name
          ).value;
        }
      );
    }

    updateVariant() {
      this.currentVariant = this.options.length
        ? this.variants.find(variant => {
            return !variant.options
              .map(
                (option, index) =>
                  this.options[index].value === option
              )
              .includes(false);
          })
        : this.variants[0];
    }

    updateMedia(data) {
      if (!this.currentVariant) return;

      if (this.isQuickviewSelector) {
        const quickview = this.closest('product-quickview');
        const images = quickview.querySelectorAll('[data-image]');
        const targetImage = Array.from(images).find(image => {
          return (
            image.dataset.variantIds?.includes(
              String(this.currentVariant.id)
            ) || image.dataset[`image${data.name}`] === data.value
          );
        });

        if (!targetImage) return;

        images.forEach(image =>
          image.classList.toggle('hidden', targetImage !== image)
        );

        return;
      }

      const productMedia =
        this.closest('main-product')?.querySelector('product-media');
      if (!productMedia) return;
      if (productMedia.hasAttribute('data-gallery-filter')) {
        productMedia.filterMedia(data);
        return;
      }
      productMedia.setActiveMedia(
        this.currentVariant.featured_media?.id || ''
      );
    }

    updateURL(sellingPlanId) {
      if (!this.currentVariant) return;
      const parent =
        this.closest('product-quickview') ||
        this.closest('main-product');
      parent
        .querySelector('[data-go-to-product]')
        ?.setAttribute(
          'href',
          `${
            this.isQuickviewSelector
              ? parent.dataset.url
              : this.dataset.url
          }/?variant=${this.currentVariant.id}`
        );
      if (this.isQuickviewSelector) return;
      if (!window.location.pathname.includes('/products')) return;
      const params = new URLSearchParams(window.location.search);
      params[params.has('variant') ? 'set' : 'append'](
        'variant',
        this.currentVariant.id
      );
      if (sellingPlanId) {
        params[params.has('selling_plan') ? 'set' : 'append'](
          'selling_plan',
          sellingPlanId
        );
      } else {
        params.delete('selling_plan');
      }
      window.history.replaceState(
        {},
        '',
        `${this.dataset.url}?${params.toString()}`
      );
    }

    updateVariantInput() {
      const inputs = [
        this.querySelector('[name="id"]'),
        this.dynamicCheckoutForm?.querySelector('[name="id"]'),
        this.installmentsForm?.querySelector('[name="id"]')
      ];
      inputs.forEach(input => {
        if (!input) return;
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    setUnavailable() {
      const mainPrice = document.querySelector(
        `#Product-Price-${this.dataset.sectionId}`
      );
      const barPrice = this.productBar?.querySelector('[data-price]');

      if (!this.submitButton) return;

      [
        this.submitButton,
        this.productBar?.querySelector('[type="submit"]')
      ].forEach(submitButton => {
        if(!submitButton) return;

        submitButton.querySelector('span').textContent =
          window.variantStrings.unavailable;
      });
      [mainPrice, barPrice].forEach(priceElement => {
        if (priceElement)
          priceElement.classList.add('visibility-hidden');
      });
    }

    toggleAddButton(disable, text) {
      const productBarSubmit =
        this.productBar?.querySelector('[type="submit"]');

      if (disable) {
        this.submitButton &&
          this.submitButton.setAttribute('disabled', 'disabled');
        !this.isQuickviewSelector &&
          productBarSubmit &&
          productBarSubmit.setAttribute('disabled', 'disabled');
        if (text)
          this.submitButton &&
            (this.submitButton.querySelector('span').textContent =
              text);
        !this.isQuickviewSelector &&
          productBarSubmit &&
          (productBarSubmit.querySelector('span').textContent = text);
      } else {
        this.submitButton &&
          this.submitButton.removeAttribute('disabled');
        !this.isQuickviewSelector &&
          productBarSubmit &&
          productBarSubmit.removeAttribute('disabled');
        this.submitButton &&
          (this.submitButton.querySelector('span').textContent =
            window.variantStrings.addToCart);
        !this.isQuickviewSelector &&
          productBarSubmit &&
          (productBarSubmit.querySelector('span').textContent =
            window.variantStrings.addToCart);
      }
    }

    fetchProductInfo() {
      const params = new URLSearchParams(window.location.search);
      params[params.has('variant') ? 'set' : 'append'](
        'variant',
        this.currentVariant.id
      );
      params.append('section_id', this.dataset.sectionId);
      params.delete('selling_plan');
      this.setLoading(true);

      fetch(`${this.dataset.url}?${params.toString()}`)
        .then(response => response.text())
        .then(responseText => {
          const html = new DOMParser().parseFromString(
            responseText,
            'text/html'
          );

          this.updateLiveRegions(html);
        });
    }

    updateLiveRegions(html) {
      const regions = [
        `#Product-Price-${this.dataset.sectionId}`,
        `#Product-Stock-Notification-${this.dataset.sectionId}`,
        `#Product-Pickup-availability-${this.dataset.sectionId}`,
        `#Product-Purchase-Options-${this.dataset.sectionId}`
      ];
      if (!this.isQuickviewSelector) {
        regions.push('product-bar [data-price]');
      }
      const sourceHTML =
        html
          .querySelector('template#quickview')
          ?.content.firstElementChild.cloneNode(true) || html;

      regions.forEach(region => {
        const destination = document.querySelector(region);
        const source = sourceHTML.querySelector(region);

        if (!destination && !source) return;
        destination.classList.remove('visibility-hidden');
        destination.innerHTML = source.innerHTML;
      });
      this.setLoading();
    }

    setLoading(loading = false) {
      const parent = this.closest('main-product');
      if (!parent) return;

      parent.classList.toggle('is-loading', loading);
    }
  }
  customElements.define('product-selector', ProductSelector);
}
