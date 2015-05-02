var EventListener = require('react/lib/EventListener');
var SyntheticKeyboardEvent = require('react/lib/SyntheticKeyboardEvent');

var documentListener;
/**
 * Enable the global event listener. Is idempotent.
 */
exports.activate = function(event) {
    if (!event) {
        event = 'keyup';
    }
    if (typeof navigator !== 'undefined' && !documentListener) {
        documentListener = EventListener.listen(document, event, handle);
    }
    return exports;
};
/**
 * Disable the global event listener. Is idempotent.
 */
exports.disable = function() {
    if (documentListener) {
        documentListener.remove();
        documentListener = null;
    }
};

// Container for all the handlers
var handlers = [];

/**
 * Mixin that calls `handlerName` on your component if it is mounted and a
 * key event has bubbled up to the document
 */
exports.Mixin = function HotkeyMixin(handlerName) {
    return {
        componentDidMount: function() {
            var handler = this[handlerName];
            handlers.push(handler);
        },
        componentWillUnmount: function() {
            var handler = this[handlerName];
            var index = handlers.indexOf(handler);
            handlers.splice(index, 1);
        }
    };
};


// Create and dispatch an event object using React's object pool
// Cribbed from SimpleEventPlugin and EventPluginHub
function handle(nativeEvent) {
    var event = SyntheticKeyboardEvent.getPooled({}, 'hotkey', nativeEvent);
    try {
        dispatchEvent(event, handlers);
    } finally {
        if (!event.isPersistent()) {
            event.constructor.release(event);
        }
    }
}
// Dispatch the event, in order, to all interested listeners
// The most recently mounted component is the first to receive the event
// Cribbed from a combination of SimpleEventPlugin and EventPluginUtils
function dispatchEvent(event, handlers) {
    for (var i = (handlers.length - 1); i >= 0; i--) {
        if (event.isPropagationStopped()) {
            break;
        }
        var returnValue = handlers[i](event);
        if (returnValue === false) {
            event.stopPropagation();
            event.preventDefault();
        }
    }
}
