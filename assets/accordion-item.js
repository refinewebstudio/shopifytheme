if (!customElements.get('accordion-item')) {
  class AccordionItem extends DropdownDisclosure {
    constructor() {
      super();
      this.accordionHeight = 0;
    }

    connectedCallback() {
      this.accordionHeight =
        this.querySelector('summary').nextElementSibling
          .scrollHeight + 'px';
      this.style.setProperty('--max-height', this.accordionHeight);
      this.querySelector('details').open = false;
    }
  }

  customElements.define('accordion-item', AccordionItem);
}
