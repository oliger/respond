const TEXT_ELEMENT = '@respond/TEXT_ELEMENT';
const INTERNAL_INSTANCE_KEY = '@respond/INTERNAL_INSTANCE_KEY';
const HANDLER_REGEXP = /on([a-z]*)/gi;

export const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children
        .filter(c => c != null && c !== false)
        .map(c => (c.type ? c : createTextElement(c)))
    }
  };
};

const createTextElement = nodeValue => {
  return createElement(TEXT_ELEMENT, { nodeValue });
};

let previousInstance;
export const render = (element, container) => {
  if (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const nextInstance = reconcile(container, previousInstance, element);
  previousInstance = nextInstance;
};

const isDomNode = element => typeof element.type === 'string';
const isTextNode = element => element.type === TEXT_ELEMENT;
const isComponent = element => typeof element.type === 'function';

const reconcile = (dom, instance, element) => {
  if (!instance) {
    // Create instance.
    const nextInstance = instantiate(element);
    dom.appendChild(nextInstance.dom);

    return nextInstance;
  } else if (!element) {
    // Remove instance.
    dom.removeChild(instance.dom);

    return null;
  } else if (isDomNode(element)) {
    const nextInstance = instantiate(element);
    dom.replaceChild(nextInstance.dom, instance.dom);

    return nextInstance;
  } else if (isComponent(element)) {
    const { componentInstance } = instance;
    componentInstance.props = element.props;

    const childElement = componentInstance.render();
    const { childInstance: previousChildInstance } = instance;

    const  childInstance = reconcile(dom, previousChildInstance, childElement);
    instance.dom = childInstance.dom;
    instance.childInstance = childInstance;
    instance.element = element;

    return instance;
  } else if (instance.element.type === element.type) {
    // Update instance.
    updateProps(instance.dom, instance.element.props, element.props);
    instance.childInstances = reconcileChildren(instance, element);
    instance.element = element;

    return instance;
  }
};

const instantiate = element => {
  return isComponent(element)
    ? instantiateComponentElement(element)
    : instantiateDomElement(element);
};

const instantiateDomElement = element => {
  const dom = isTextNode(element)
    ? document.createTextNode(element.props.nodeValue)
    : document.createElement(element.type);

  updateProps(dom, {}, element.props);

  const childInstances = element.props.children.map(c => {
    const childInstance = instantiate(c);
    dom.appendChild(childInstance.dom);

    return childInstance;
  });

  return {
    dom,
    element,
    childInstances
  };
};

const instantiateComponentElement = element => {
  const componentInstance = new element.type(element.props);

  const childElement = componentInstance.render();
  const childInstance = instantiate(childElement);
  const dom = childInstance.dom;

  const instance = {
    element,
    componentInstance,
    dom,
    childInstance
  };

  componentInstance[INTERNAL_INSTANCE_KEY] = instance;

  return instance;
};

const updateProps = (dom, previousProps, nextProps) => {
  Object.keys(previousProps).forEach(k => {
    // Clean previous event handlers.
    const eventType = getEventType(k);
    if (eventType) {
      dom.removeEventListener(eventType, previousProps[k]);
    }

    // Clean previous attributes.
    if (isAttribute(k)) {
      dom[k] = null;
    }
  });

  Object.keys(nextProps).forEach(k => {
    // Set event handlers.
    const eventType = getEventType(k);
    if (eventType) {
      dom.addEventListener(eventType, nextProps[k]);
    }

    // Set attributes.
    if (isAttribute(k)) {
      dom[k] = nextProps[k];
    }
  });
};

const getEventType = key => {
  const matches = HANDLER_REGEXP.exec(key);
  return !!matches && matches[1].toLowerCase();
};

const isAttribute = key => !getEventType(key) && key !== 'children';

const reconcileChildren = (instance, element) => {
  return instance.childInstances.reduce((m, c, i) => {
    const childElement = element.props.children[i];
    const nextChildInstance = reconcile(instance.dom, c, childElement);

    if (nextChildInstance) {
      m.push(nextChildInstance);
    }

    return m;
  }, []);
};

export class Component {
  constructor(props) {
    this.props = {};
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    updateComponentInstance(this);
  }
}

const updateComponentInstance = componentInstance => {
  const instance = componentInstance[INTERNAL_INSTANCE_KEY];
  reconcile(instance.dom.parentNode, instance, instance.element);
};
