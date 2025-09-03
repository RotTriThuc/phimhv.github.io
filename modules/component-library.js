/* Component Library - Reusable UI components with Storybook-style documentation */

import { Logger } from './logger.js';
import { createEl, sanitizeHtml } from './utils.js';
import { imageLoader } from './image-loader.js';

// Base Component class
export class Component {
  constructor(props = {}) {
    this.props = props;
    this.element = null;
    this.children = [];
    this.eventListeners = new Map();
    this.mounted = false;
  }

  // Create the component element
  createElement() {
    throw new Error('createElement must be implemented by subclass');
  }

  // Render the component
  render() {
    if (!this.element) {
      this.element = this.createElement();
      this.bindEvents();
    }
    return this.element;
  }

  // Update component props
  update(newProps) {
    const oldProps = this.props;
    this.props = { ...this.props, ...newProps };

    if (this.shouldUpdate(oldProps, this.props)) {
      this.rerender();
    }
  }

  // Check if component should update
  shouldUpdate(oldProps, newProps) {
    return JSON.stringify(oldProps) !== JSON.stringify(newProps);
  }

  // Rerender component
  rerender() {
    if (this.element && this.element.parentNode) {
      const newElement = this.createElement();
      this.bindEvents();
      this.element.parentNode.replaceChild(newElement, this.element);
      this.element = newElement;
    }
  }

  // Bind event listeners
  bindEvents() {
    // Override in subclasses
  }

  // Add event listener
  addEventListener(event, handler) {
    if (this.element) {
      this.element.addEventListener(event, handler);
      this.eventListeners.set(event, handler);
    }
  }

  // Remove event listener
  removeEventListener(event) {
    if (this.element && this.eventListeners.has(event)) {
      const handler = this.eventListeners.get(event);
      this.element.removeEventListener(event, handler);
      this.eventListeners.delete(event);
    }
  }

  // Mount component
  mount(container) {
    if (!this.mounted) {
      container.appendChild(this.render());
      this.mounted = true;
      this.onMount();
    }
  }

  // Unmount component
  unmount() {
    if (this.mounted && this.element && this.element.parentNode) {
      this.onUnmount();
      this.element.parentNode.removeChild(this.element);
      this.mounted = false;
    }
  }

  // Lifecycle hooks
  onMount() {
    // Override in subclasses
  }

  onUnmount() {
    // Cleanup event listeners
    this.eventListeners.forEach((handler, event) => {
      this.removeEventListener(event);
    });
  }

  // Destroy component
  destroy() {
    this.unmount();
    this.children.forEach((child) => child.destroy());
    this.children = [];
    this.element = null;
  }
}

// Button Component
export class Button extends Component {
  constructor(props) {
    super({
      text: 'Button',
      variant: 'primary', // primary, secondary, danger, success
      size: 'medium', // small, medium, large
      disabled: false,
      loading: false,
      icon: null,
      onClick: () => {},
      ...props
    });
  }

  createElement() {
    const button = createEl('button', this.getClassName());

    if (this.props.disabled || this.props.loading) {
      button.disabled = true;
    }

    // Add icon if provided
    if (this.props.icon) {
      const icon = createEl('span', 'btn__icon', this.props.icon);
      button.appendChild(icon);
    }

    // Add loading spinner if loading
    if (this.props.loading) {
      const spinner = createEl('span', 'btn__spinner');
      button.appendChild(spinner);
    }

    // Add text
    const text = createEl('span', 'btn__text', this.props.text);
    button.appendChild(text);

    return button;
  }

  getClassName() {
    const classes = [
      'btn',
      `btn--${this.props.variant}`,
      `btn--${this.props.size}`
    ];

    if (this.props.loading) classes.push('btn--loading');
    if (this.props.disabled) classes.push('btn--disabled');

    return classes.join(' ');
  }

  bindEvents() {
    this.addEventListener('click', (e) => {
      if (!this.props.disabled && !this.props.loading) {
        this.props.onClick(e);
      }
    });
  }
}

// Card Component
export class Card extends Component {
  constructor(props) {
    super({
      title: '',
      subtitle: '',
      content: '',
      image: null,
      actions: [],
      variant: 'default', // default, elevated, outlined
      clickable: false,
      onClick: () => {},
      ...props
    });
  }

  createElement() {
    const card = createEl('div', this.getClassName());

    // Image section
    if (this.props.image) {
      const imageContainer = createEl('div', 'card__image-container');
      const image = createEl('img', 'card__image');
      image.dataset.src = this.props.image.src;
      image.alt = this.props.image.alt || '';

      imageContainer.appendChild(image);
      card.appendChild(imageContainer);

      // Setup lazy loading
      imageLoader.observe(image);
    }

    // Content section
    const content = createEl('div', 'card__content');

    if (this.props.title) {
      const title = createEl('h3', 'card__title', this.props.title);
      content.appendChild(title);
    }

    if (this.props.subtitle) {
      const subtitle = createEl('p', 'card__subtitle', this.props.subtitle);
      content.appendChild(subtitle);
    }

    if (this.props.content) {
      const contentEl = createEl('div', 'card__body');
      contentEl.innerHTML = sanitizeHtml(this.props.content);
      content.appendChild(contentEl);
    }

    card.appendChild(content);

    // Actions section
    if (this.props.actions.length > 0) {
      const actions = createEl('div', 'card__actions');

      this.props.actions.forEach((action) => {
        const button = new Button({
          text: action.text,
          variant: action.variant || 'secondary',
          size: 'small',
          onClick: action.onClick
        });
        actions.appendChild(button.render());
        this.children.push(button);
      });

      card.appendChild(actions);
    }

    return card;
  }

  getClassName() {
    const classes = ['card', `card--${this.props.variant}`];

    if (this.props.clickable) classes.push('card--clickable');

    return classes.join(' ');
  }

  bindEvents() {
    if (this.props.clickable) {
      this.addEventListener('click', this.props.onClick);
    }
  }
}

// Modal Component
export class Modal extends Component {
  constructor(props) {
    super({
      title: '',
      content: '',
      size: 'medium', // small, medium, large, fullscreen
      closable: true,
      backdrop: true,
      onClose: () => {},
      onOpen: () => {},
      ...props
    });
  }

  createElement() {
    const modal = createEl('div', 'modal');

    // Backdrop
    if (this.props.backdrop) {
      const backdrop = createEl('div', 'modal__backdrop');
      modal.appendChild(backdrop);
    }

    // Container
    const container = createEl(
      'div',
      `modal__container modal__container--${this.props.size}`
    );

    // Header
    const header = createEl('div', 'modal__header');

    if (this.props.title) {
      const title = createEl('h2', 'modal__title', this.props.title);
      header.appendChild(title);
    }

    if (this.props.closable) {
      const closeBtn = createEl('button', 'modal__close', '×');
      closeBtn.setAttribute('aria-label', 'Close');
      header.appendChild(closeBtn);
    }

    container.appendChild(header);

    // Content
    const content = createEl('div', 'modal__content');
    if (typeof this.props.content === 'string') {
      content.innerHTML = sanitizeHtml(this.props.content);
    } else if (this.props.content instanceof HTMLElement) {
      content.appendChild(this.props.content);
    }
    container.appendChild(content);

    modal.appendChild(container);
    return modal;
  }

  bindEvents() {
    // Close on backdrop click
    if (this.props.backdrop) {
      const backdrop = this.element.querySelector('.modal__backdrop');
      backdrop.addEventListener('click', () => this.close());
    }

    // Close on close button click
    if (this.props.closable) {
      const closeBtn = this.element.querySelector('.modal__close');
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close on ESC key
    this.escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  open() {
    document.body.appendChild(this.render());
    document.body.classList.add('modal-open');
    this.props.onOpen();
  }

  close() {
    this.props.onClose();
    document.body.classList.remove('modal-open');
    this.destroy();
  }

  onUnmount() {
    super.onUnmount();
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }
  }
}

// Loading Component
export class Loading extends Component {
  constructor(props) {
    super({
      text: 'Loading...',
      size: 'medium', // small, medium, large
      variant: 'spinner', // spinner, dots, bars
      ...props
    });
  }

  createElement() {
    const loading = createEl('div', `loading loading--${this.props.size}`);

    // Spinner element
    const spinner = createEl('div', `loading__${this.props.variant}`);
    loading.appendChild(spinner);

    // Text
    if (this.props.text) {
      const text = createEl('div', 'loading__text', this.props.text);
      loading.appendChild(text);
    }

    return loading;
  }
}

// Notification Component
export class Notification extends Component {
  constructor(props) {
    super({
      message: '',
      type: 'info', // info, success, warning, error
      duration: 4000,
      closable: true,
      onClose: () => {},
      ...props
    });
  }

  createElement() {
    const notification = createEl(
      'div',
      `notification notification--${this.props.type}`
    );

    // Content
    const content = createEl('div', 'notification__content');

    // Message
    const message = createEl(
      'span',
      'notification__message',
      this.props.message
    );
    content.appendChild(message);

    // Close button
    if (this.props.closable) {
      const closeBtn = createEl('button', 'notification__close', '×');
      closeBtn.setAttribute('aria-label', 'Close');
      content.appendChild(closeBtn);
    }

    notification.appendChild(content);
    return notification;
  }

  bindEvents() {
    // Auto close
    if (this.props.duration > 0) {
      this.autoCloseTimer = setTimeout(() => {
        this.close();
      }, this.props.duration);
    }

    // Manual close
    if (this.props.closable) {
      const closeBtn = this.element.querySelector('.notification__close');
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  close() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }

    this.element.classList.add('notification--closing');
    setTimeout(() => {
      this.props.onClose();
      this.destroy();
    }, 300);
  }

  show() {
    const container =
      document.querySelector('.notifications-container') ||
      this.createNotificationContainer();

    container.appendChild(this.render());

    // Animate in
    requestAnimationFrame(() => {
      this.element.classList.add('notification--show');
    });
  }

  createNotificationContainer() {
    const container = createEl('div', 'notifications-container');
    document.body.appendChild(container);
    return container;
  }
}

// Component Registry for Storybook-style documentation
export class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.stories = new Map();
  }

  register(name, componentClass, stories = []) {
    this.components.set(name, componentClass);
    this.stories.set(name, stories);
    Logger.debug(`Component registered: ${name}`);
  }

  getComponent(name) {
    return this.components.get(name);
  }

  getStories(name) {
    return this.stories.get(name) || [];
  }

  getAllComponents() {
    return Array.from(this.components.keys());
  }

  createStorybook() {
    const storybook = createEl('div', 'storybook');

    // Header
    const header = createEl('div', 'storybook__header');
    header.innerHTML = '<h1>Component Library</h1>';
    storybook.appendChild(header);

    // Navigation
    const nav = createEl('nav', 'storybook__nav');
    const componentList = createEl('ul', 'storybook__component-list');

    this.getAllComponents().forEach((name) => {
      const item = createEl('li', 'storybook__component-item');
      const link = createEl('a', 'storybook__component-link', name);
      link.href = `#${name}`;
      item.appendChild(link);
      componentList.appendChild(item);
    });

    nav.appendChild(componentList);
    storybook.appendChild(nav);

    // Content
    const content = createEl('div', 'storybook__content');

    this.getAllComponents().forEach((name) => {
      const section = this.createComponentSection(name);
      content.appendChild(section);
    });

    storybook.appendChild(content);
    return storybook;
  }

  createComponentSection(name) {
    const section = createEl('section', 'storybook__section');
    section.id = name;

    // Component title
    const title = createEl('h2', 'storybook__component-title', name);
    section.appendChild(title);

    // Stories
    const stories = this.getStories(name);

    stories.forEach((story) => {
      const storyEl = createEl('div', 'storybook__story');

      // Story title
      const storyTitle = createEl('h3', 'storybook__story-title', story.name);
      storyEl.appendChild(storyTitle);

      // Story description
      if (story.description) {
        const desc = createEl(
          'p',
          'storybook__story-description',
          story.description
        );
        storyEl.appendChild(desc);
      }

      // Story example
      const example = createEl('div', 'storybook__story-example');
      const ComponentClass = this.getComponent(name);
      const component = new ComponentClass(story.props);
      example.appendChild(component.render());
      storyEl.appendChild(example);

      // Story code
      const code = createEl('pre', 'storybook__story-code');
      code.textContent = `new ${name}(${JSON.stringify(story.props, null, 2)})`;
      storyEl.appendChild(code);

      section.appendChild(storyEl);
    });

    return section;
  }
}

// Global component registry
export const componentRegistry = new ComponentRegistry();

// Register built-in components
componentRegistry.register('Button', Button, [
  {
    name: 'Primary Button',
    description: 'Standard primary button',
    props: { text: 'Primary Button', variant: 'primary' }
  },
  {
    name: 'Secondary Button',
    description: 'Secondary button variant',
    props: { text: 'Secondary Button', variant: 'secondary' }
  },
  {
    name: 'Loading Button',
    description: 'Button in loading state',
    props: { text: 'Loading...', variant: 'primary', loading: true }
  }
]);

componentRegistry.register('Card', Card, [
  {
    name: 'Basic Card',
    description: 'Simple card with title and content',
    props: {
      title: 'Card Title',
      content: 'This is the card content.',
      variant: 'default'
    }
  },
  {
    name: 'Card with Image',
    description: 'Card with image and actions',
    props: {
      title: 'Movie Card',
      subtitle: '2023 • Action',
      image: {
        src: 'https://via.placeholder.com/300x200',
        alt: 'Movie poster'
      },
      actions: [
        { text: 'Watch', variant: 'primary', onClick: () => {} },
        { text: 'Save', variant: 'secondary', onClick: () => {} }
      ]
    }
  }
]);

componentRegistry.register('Modal', Modal, [
  {
    name: 'Basic Modal',
    description: 'Simple modal dialog',
    props: {
      title: 'Modal Title',
      content: 'This is the modal content.',
      size: 'medium'
    }
  }
]);

componentRegistry.register('Loading', Loading, [
  {
    name: 'Spinner Loading',
    description: 'Loading spinner with text',
    props: { text: 'Loading...', variant: 'spinner' }
  }
]);

componentRegistry.register('Notification', Notification, [
  {
    name: 'Success Notification',
    description: 'Success message notification',
    props: { message: 'Operation completed successfully!', type: 'success' }
  },
  {
    name: 'Error Notification',
    description: 'Error message notification',
    props: { message: 'Something went wrong!', type: 'error' }
  }
]);

Logger.info('📚 Component library initialized with built-in components');
