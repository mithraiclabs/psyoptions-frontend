const isNode = typeof window === 'undefined';
const isBrowser = !isNode;

export { isNode, isBrowser };
