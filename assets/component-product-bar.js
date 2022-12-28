class ProductBar extends HTMLElement {
  constructor() {
    super();

    this.productSelectors = Array.from(
      document
        .querySelector('product-selector')
        .querySelectorAll('[data-name]')
    );
    this.debouncedScroll = debounce(
      () => this.toggleVisibility(),
      300
    );
    this.changeEvent = new Event('change', { bubbles: true });
    this.setHandlers();
  }

  setHandlers() {
    window.addEventListener(
      'scroll',
      this.debouncedScroll.bind(this)
    );
    window.addEventListener(
      'resize',
      this.debouncedScroll.bind(this)
    );
    window.addEventListener('load', this.toggleVisibility());
    this.addEventListener('change', event => {
      this.onChange({
        name: event.target.dataset.name || event.target.name,
        value: event.target.value,
        type: event.target.type
      });
    });
  }

  toggleVisibility() {
    const formActions = document.querySelector(
      '[data-product-actions]'
    );

    this.classList.toggle(
      'is-hidden',
      window.scrollY < getOffsetTop(formActions) ||
        window.scrollY + window.innerHeight >=
          document.body.offsetHeight
    );
  }

  onChange({ name, value, type }) {
    if (type === 'number') {
      const quantity = document.querySelector(
        'main-product [name="quantity"]'
      );

      if (!quantity) return;

      quantity.value = value;
      quantity.dispatchEvent(this.changeEvent);

      return;
    }

    const matchedSelector = this.productSelectors
      .filter(
        selector =>
          selector.dataset.name === name || selector.name === name
      )
      .find(selector => {
        if (selector.type === 'select-one') return selector;
        return selector.value === value;
      });

    if (!matchedSelector)
      throw new Error(`Selector not found with name ${name}`);

    if (matchedSelector.type === 'radio') {
      matchedSelector.click();
      return;
    }

    matchedSelector.value = value;
    Array.from(matchedSelector.options).map(option =>
      option.toggleAttribute('selected', option.value === value)
    );
    matchedSelector.dispatchEvent(this.changeEvent);
  }
}

customElements.define('product-bar', ProductBar);
