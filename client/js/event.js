export function dispatch(eventType, payload) {
    const event = new CustomEvent(eventType, {
        detail: payload,
    });

    window.dispatchEvent(event);
};